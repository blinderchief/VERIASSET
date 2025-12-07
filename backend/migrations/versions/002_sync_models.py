"""Sync database schema with SQLModel definitions

Revision ID: 002_sync_models
Revises: 001_initial
Create Date: 2025-12-07 21:20:00.000000

This migration syncs the database schema with the current SQLModel definitions.
The initial migration had different column names and missing columns.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_sync_models'
down_revision: Union[str, None] = '001_initial'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ==================== Users Table Updates ====================
    # Add missing columns to users table
    op.add_column('users', sa.Column('username', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('full_name', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('avatar_url', sa.String(500), nullable=True))
    op.add_column('users', sa.Column('qubic_public_key', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), server_default='false'))
    op.add_column('users', sa.Column('is_admin', sa.Boolean(), server_default='false'))
    op.add_column('users', sa.Column('user_metadata', sa.JSON(), server_default='{}'))
    
    # Rename wallet_connected to match model if needed, or just drop it
    op.drop_column('users', 'wallet_connected')
    op.drop_column('users', 'kyc_verified')
    
    # Add indexes
    op.create_index('ix_users_username', 'users', ['username'])
    op.create_index('ix_users_qubic_public_key', 'users', ['qubic_public_key'])
    op.create_index('ix_users_email', 'users', ['email'])
    
    # ==================== RWA Assets Table Updates ====================
    # Rename owner_id to creator_id
    op.alter_column('rwa_assets', 'owner_id', new_column_name='creator_id')
    
    # Add missing columns
    op.add_column('rwa_assets', sa.Column('circulating_supply', sa.BigInteger(), server_default='0'))
    op.add_column('rwa_assets', sa.Column('currency', sa.String(20), server_default='QUBIC'))
    op.add_column('rwa_assets', sa.Column('verification_hash', sa.String(255), nullable=True))
    op.add_column('rwa_assets', sa.Column('qubic_contract_address', sa.String(255), nullable=True))
    op.add_column('rwa_assets', sa.Column('qubic_asset_id', sa.String(255), nullable=True))
    op.add_column('rwa_assets', sa.Column('qubic_tx_hash', sa.String(255), nullable=True))
    op.add_column('rwa_assets', sa.Column('image_url', sa.String(500), nullable=True))
    op.add_column('rwa_assets', sa.Column('document_urls', sa.JSON(), server_default='[]'))
    op.add_column('rwa_assets', sa.Column('external_data_sources', sa.JSON(), server_default='[]'))
    op.add_column('rwa_assets', sa.Column('asset_metadata', sa.JSON(), server_default='{}'))
    op.add_column('rwa_assets', sa.Column('verification_data', sa.JSON(), server_default='{}'))
    op.add_column('rwa_assets', sa.Column('price_per_unit', sa.Float(), server_default='0.0'))
    
    # Rename and adjust existing columns
    op.alter_column('rwa_assets', 'available_supply', new_column_name='total_supply_old', existing_type=sa.BigInteger())
    
    # Drop old columns that are renamed/replaced
    op.drop_column('rwa_assets', 'price_per_token')
    op.drop_column('rwa_assets', 'verified')
    op.drop_column('rwa_assets', 'verification_details')
    op.drop_column('rwa_assets', 'metadata')
    op.drop_column('rwa_assets', 'token_id')
    op.drop_column('rwa_assets', 'contract_address')
    op.drop_column('rwa_assets', 'total_supply_old')
    
    # Update index
    op.drop_index('ix_rwa_assets_owner_id', 'rwa_assets')
    op.drop_index('ix_rwa_assets_verified', 'rwa_assets')
    op.create_index('ix_rwa_assets_creator_id', 'rwa_assets', ['creator_id'])
    op.create_index('ix_rwa_assets_status', 'rwa_assets', ['status'])
    op.create_index('ix_rwa_assets_symbol', 'rwa_assets', ['symbol'])
    op.create_index('ix_rwa_assets_qubic_contract_address', 'rwa_assets', ['qubic_contract_address'])
    op.create_index('ix_rwa_assets_qubic_asset_id', 'rwa_assets', ['qubic_asset_id'])
    
    # ==================== Trades Table Updates ====================
    # Add user_id column (combines buyer/seller concept)
    op.add_column('trades', sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=True))
    op.add_column('trades', sa.Column('trade_type', sa.String(20), nullable=True))
    op.add_column('trades', sa.Column('quantity', sa.Integer(), server_default='0'))
    op.add_column('trades', sa.Column('price_per_unit', sa.Float(), server_default='0.0'))
    op.add_column('trades', sa.Column('total_amount', sa.Float(), server_default='0.0'))
    op.add_column('trades', sa.Column('fee_amount', sa.Float(), server_default='0.0'))
    op.add_column('trades', sa.Column('fee_burned', sa.Float(), server_default='0.0'))
    op.add_column('trades', sa.Column('qubic_tx_hash', sa.String(255), nullable=True))
    op.add_column('trades', sa.Column('qubic_tick', sa.Integer(), nullable=True))
    op.add_column('trades', sa.Column('settled_at', sa.DateTime(), nullable=True))
    op.add_column('trades', sa.Column('settlement_data', sa.JSON(), server_default='{}'))
    op.add_column('trades', sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()))
    
    # Drop old columns
    op.drop_index('ix_trades_buyer_id', 'trades')
    op.drop_index('ix_trades_seller_id', 'trades')
    op.drop_column('trades', 'buyer_id')
    op.drop_column('trades', 'seller_id')
    op.drop_column('trades', 'order_type')
    op.drop_column('trades', 'amount')
    op.drop_column('trades', 'price')
    op.drop_column('trades', 'total')
    op.drop_column('trades', 'fee')
    op.drop_column('trades', 'tx_hash')
    op.drop_column('trades', 'executed_at')
    
    op.create_index('ix_trades_user_id', 'trades', ['user_id'])
    op.create_index('ix_trades_trade_type', 'trades', ['trade_type'])
    op.create_index('ix_trades_qubic_tx_hash', 'trades', ['qubic_tx_hash'])
    
    # ==================== Create Verifications Table ====================
    op.create_table(
        'verifications',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('asset_id', sa.String(36), sa.ForeignKey('rwa_assets.id'), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='pending'),
        sa.Column('verification_type', sa.String(50), nullable=False),
        sa.Column('input_data', sa.JSON(), server_default='{}'),
        sa.Column('input_hash', sa.String(255), nullable=False),
        sa.Column('ai_model', sa.String(100), server_default='gemini-1.5-flash'),
        sa.Column('ai_response', sa.JSON(), server_default='{}'),
        sa.Column('confidence_score', sa.Float(), server_default='0.0'),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('issues', sa.JSON(), server_default='[]'),
        sa.Column('proof_hash', sa.String(255), nullable=True),
        sa.Column('oracle_signature', sa.String(255), nullable=True),
        sa.Column('processing_time_ms', sa.Integer(), server_default='0'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_verifications_asset_id', 'verifications', ['asset_id'])
    op.create_index('ix_verifications_status', 'verifications', ['status'])
    op.create_index('ix_verifications_verification_type', 'verifications', ['verification_type'])
    
    # ==================== Create Nostromo Proposals Table ====================
    op.create_table(
        'nostromo_proposals',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('asset_id', sa.String(36), sa.ForeignKey('rwa_assets.id'), unique=True, nullable=False),
        sa.Column('status', sa.String(50), nullable=False, server_default='draft'),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('pitch_deck_url', sa.String(500), nullable=True),
        sa.Column('votes_for', sa.Integer(), server_default='0'),
        sa.Column('votes_against', sa.Integer(), server_default='0'),
        sa.Column('quorum_required', sa.Integer(), server_default='451'),
        sa.Column('voting_deadline', sa.DateTime(), nullable=True),
        sa.Column('ipo_start_price', sa.Float(), nullable=True),
        sa.Column('ipo_end_price', sa.Float(), nullable=True),
        sa.Column('ipo_total_shares', sa.Integer(), nullable=True),
        sa.Column('ipo_shares_sold', sa.Integer(), server_default='0'),
        sa.Column('ipo_start_time', sa.DateTime(), nullable=True),
        sa.Column('ipo_end_time', sa.DateTime(), nullable=True),
        sa.Column('final_price', sa.Float(), nullable=True),
        sa.Column('total_raised', sa.Float(), server_default='0.0'),
        sa.Column('qubic_proposal_id', sa.String(255), nullable=True),
        sa.Column('qubic_tx_hash', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_nostromo_proposals_asset_id', 'nostromo_proposals', ['asset_id'])
    op.create_index('ix_nostromo_proposals_status', 'nostromo_proposals', ['status'])
    
    # ==================== Create EasyConnect Events Table ====================
    op.create_table(
        'easyconnect_events',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('payload', sa.JSON(), server_default='{}'),
        sa.Column('delivered', sa.Boolean(), server_default='false'),
        sa.Column('delivery_attempts', sa.Integer(), server_default='0'),
        sa.Column('last_attempt_at', sa.DateTime(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('webhook_response', sa.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_easyconnect_events_event_type', 'easyconnect_events', ['event_type'])


def downgrade() -> None:
    # Drop new tables
    op.drop_table('easyconnect_events')
    op.drop_table('nostromo_proposals')
    op.drop_table('verifications')
    
    # Revert trades table
    op.drop_index('ix_trades_qubic_tx_hash', 'trades')
    op.drop_index('ix_trades_trade_type', 'trades')
    op.drop_index('ix_trades_user_id', 'trades')
    op.drop_column('trades', 'settlement_data')
    op.drop_column('trades', 'settled_at')
    op.drop_column('trades', 'qubic_tick')
    op.drop_column('trades', 'qubic_tx_hash')
    op.drop_column('trades', 'fee_burned')
    op.drop_column('trades', 'fee_amount')
    op.drop_column('trades', 'total_amount')
    op.drop_column('trades', 'price_per_unit')
    op.drop_column('trades', 'quantity')
    op.drop_column('trades', 'trade_type')
    op.drop_column('trades', 'user_id')
    op.drop_column('trades', 'updated_at')
    op.add_column('trades', sa.Column('buyer_id', sa.String(36), sa.ForeignKey('users.id'), nullable=True))
    op.add_column('trades', sa.Column('seller_id', sa.String(36), sa.ForeignKey('users.id'), nullable=True))
    op.add_column('trades', sa.Column('order_type', sa.String(10), nullable=False))
    op.add_column('trades', sa.Column('amount', sa.BigInteger(), nullable=False))
    op.add_column('trades', sa.Column('price', sa.Numeric(20, 8), nullable=False))
    op.add_column('trades', sa.Column('total', sa.Numeric(20, 8), nullable=False))
    op.add_column('trades', sa.Column('fee', sa.Numeric(20, 8), nullable=False))
    op.add_column('trades', sa.Column('tx_hash', sa.String(100), nullable=True))
    op.add_column('trades', sa.Column('executed_at', sa.DateTime(), nullable=True))
    op.create_index('ix_trades_buyer_id', 'trades', ['buyer_id'])
    op.create_index('ix_trades_seller_id', 'trades', ['seller_id'])
    
    # Revert rwa_assets table  
    op.drop_index('ix_rwa_assets_qubic_asset_id', 'rwa_assets')
    op.drop_index('ix_rwa_assets_qubic_contract_address', 'rwa_assets')
    op.drop_index('ix_rwa_assets_symbol', 'rwa_assets')
    op.drop_index('ix_rwa_assets_status', 'rwa_assets')
    op.drop_index('ix_rwa_assets_creator_id', 'rwa_assets')
    op.alter_column('rwa_assets', 'creator_id', new_column_name='owner_id')
    op.drop_column('rwa_assets', 'verification_data')
    op.drop_column('rwa_assets', 'asset_metadata')
    op.drop_column('rwa_assets', 'external_data_sources')
    op.drop_column('rwa_assets', 'document_urls')
    op.drop_column('rwa_assets', 'image_url')
    op.drop_column('rwa_assets', 'qubic_tx_hash')
    op.drop_column('rwa_assets', 'qubic_asset_id')
    op.drop_column('rwa_assets', 'qubic_contract_address')
    op.drop_column('rwa_assets', 'verification_hash')
    op.drop_column('rwa_assets', 'currency')
    op.drop_column('rwa_assets', 'circulating_supply')
    op.drop_column('rwa_assets', 'price_per_unit')
    op.add_column('rwa_assets', sa.Column('available_supply', sa.BigInteger(), nullable=False))
    op.add_column('rwa_assets', sa.Column('price_per_token', sa.Numeric(20, 8), nullable=False))
    op.add_column('rwa_assets', sa.Column('verified', sa.Boolean(), default=False))
    op.add_column('rwa_assets', sa.Column('verification_details', sa.JSON(), nullable=True))
    op.add_column('rwa_assets', sa.Column('metadata', sa.JSON(), nullable=True))
    op.add_column('rwa_assets', sa.Column('token_id', sa.String(100), nullable=True))
    op.add_column('rwa_assets', sa.Column('contract_address', sa.String(100), nullable=True))
    op.create_index('ix_rwa_assets_owner_id', 'rwa_assets', ['owner_id'])
    op.create_index('ix_rwa_assets_verified', 'rwa_assets', ['verified'])
    
    # Revert users table
    op.drop_index('ix_users_email', 'users')
    op.drop_index('ix_users_qubic_public_key', 'users')
    op.drop_index('ix_users_username', 'users')
    op.drop_column('users', 'user_metadata')
    op.drop_column('users', 'is_admin')
    op.drop_column('users', 'is_verified')
    op.drop_column('users', 'qubic_public_key')
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'full_name')
    op.drop_column('users', 'username')
    op.add_column('users', sa.Column('wallet_connected', sa.Boolean(), default=False))
    op.add_column('users', sa.Column('kyc_verified', sa.Boolean(), default=False))

"""Initial migration - Create all tables

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('clerk_id', sa.String(255), unique=True, nullable=False),
        sa.Column('email', sa.String(255), unique=True, nullable=False),
        sa.Column('wallet_address', sa.String(100), unique=True, nullable=True),
        sa.Column('wallet_connected', sa.Boolean(), default=False),
        sa.Column('kyc_verified', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_users_clerk_id', 'users', ['clerk_id'])
    op.create_index('ix_users_wallet_address', 'users', ['wallet_address'])

    # Create RWA assets table
    op.create_table(
        'rwa_assets',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('asset_type', sa.String(50), nullable=False),
        sa.Column('symbol', sa.String(20), nullable=False),
        sa.Column('total_supply', sa.BigInteger(), nullable=False),
        sa.Column('available_supply', sa.BigInteger(), nullable=False),
        sa.Column('price_per_token', sa.Numeric(20, 8), nullable=False),
        sa.Column('owner_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('verified', sa.Boolean(), default=False),
        sa.Column('verification_score', sa.Float(), nullable=True),
        sa.Column('verification_details', sa.JSON(), nullable=True),
        sa.Column('metadata', sa.JSON(), nullable=True),
        sa.Column('token_id', sa.String(100), nullable=True),
        sa.Column('contract_address', sa.String(100), nullable=True),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now()),
    )
    op.create_index('ix_rwa_assets_asset_type', 'rwa_assets', ['asset_type'])
    op.create_index('ix_rwa_assets_owner_id', 'rwa_assets', ['owner_id'])
    op.create_index('ix_rwa_assets_verified', 'rwa_assets', ['verified'])

    # Create trades table
    op.create_table(
        'trades',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('asset_id', sa.String(36), sa.ForeignKey('rwa_assets.id'), nullable=False),
        sa.Column('buyer_id', sa.String(36), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('seller_id', sa.String(36), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('order_type', sa.String(10), nullable=False),
        sa.Column('amount', sa.BigInteger(), nullable=False),
        sa.Column('price', sa.Numeric(20, 8), nullable=False),
        sa.Column('total', sa.Numeric(20, 8), nullable=False),
        sa.Column('fee', sa.Numeric(20, 8), nullable=False),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('tx_hash', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('executed_at', sa.DateTime(), nullable=True),
    )
    op.create_index('ix_trades_asset_id', 'trades', ['asset_id'])
    op.create_index('ix_trades_buyer_id', 'trades', ['buyer_id'])
    op.create_index('ix_trades_seller_id', 'trades', ['seller_id'])
    op.create_index('ix_trades_status', 'trades', ['status'])

    # Create governance proposals table
    op.create_table(
        'governance_proposals',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('category', sa.String(50), nullable=False),
        sa.Column('proposer_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('asset_id', sa.String(36), sa.ForeignKey('rwa_assets.id'), nullable=True),
        sa.Column('status', sa.String(20), default='active'),
        sa.Column('votes_for', sa.Integer(), default=0),
        sa.Column('votes_against', sa.Integer(), default=0),
        sa.Column('quorum_required', sa.Integer(), default=100),
        sa.Column('threshold_ratio', sa.Float(), default=2.0),
        sa.Column('start_time', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_governance_proposals_status', 'governance_proposals', ['status'])
    op.create_index('ix_governance_proposals_proposer_id', 'governance_proposals', ['proposer_id'])

    # Create votes table
    op.create_table(
        'governance_votes',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('proposal_id', sa.String(36), sa.ForeignKey('governance_proposals.id'), nullable=False),
        sa.Column('voter_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('vote', sa.String(10), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint('proposal_id', 'voter_id', name='uq_vote_per_proposal'),
    )

    # Create IPO/Dutch auction table
    op.create_table(
        'dutch_auctions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('asset_id', sa.String(36), sa.ForeignKey('rwa_assets.id'), nullable=False),
        sa.Column('start_price', sa.Numeric(20, 8), nullable=False),
        sa.Column('end_price', sa.Numeric(20, 8), nullable=False),
        sa.Column('current_price', sa.Numeric(20, 8), nullable=False),
        sa.Column('total_tokens', sa.BigInteger(), nullable=False),
        sa.Column('sold_tokens', sa.BigInteger(), default=0),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('start_time', sa.DateTime(), nullable=False),
        sa.Column('end_time', sa.DateTime(), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_dutch_auctions_status', 'dutch_auctions', ['status'])
    op.create_index('ix_dutch_auctions_asset_id', 'dutch_auctions', ['asset_id'])

    # Create auction bids table
    op.create_table(
        'auction_bids',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('auction_id', sa.String(36), sa.ForeignKey('dutch_auctions.id'), nullable=False),
        sa.Column('bidder_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('amount', sa.BigInteger(), nullable=False),
        sa.Column('max_price', sa.Numeric(20, 8), nullable=False),
        sa.Column('filled_price', sa.Numeric(20, 8), nullable=True),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('tx_hash', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_auction_bids_auction_id', 'auction_bids', ['auction_id'])
    op.create_index('ix_auction_bids_bidder_id', 'auction_bids', ['bidder_id'])

    # Create webhooks table
    op.create_table(
        'webhooks',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('url', sa.String(500), nullable=False),
        sa.Column('events', sa.JSON(), nullable=False),
        sa.Column('secret', sa.String(255), nullable=False),
        sa.Column('active', sa.Boolean(), default=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )

    # Create webhook deliveries table
    op.create_table(
        'webhook_deliveries',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('webhook_id', sa.String(36), sa.ForeignKey('webhooks.id'), nullable=False),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('payload', sa.JSON(), nullable=False),
        sa.Column('status', sa.String(20), default='pending'),
        sa.Column('response_code', sa.Integer(), nullable=True),
        sa.Column('attempts', sa.Integer(), default=0),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.Column('delivered_at', sa.DateTime(), nullable=True),
    )


def downgrade() -> None:
    op.drop_table('webhook_deliveries')
    op.drop_table('webhooks')
    op.drop_table('auction_bids')
    op.drop_table('dutch_auctions')
    op.drop_table('governance_votes')
    op.drop_table('governance_proposals')
    op.drop_table('trades')
    op.drop_table('rwa_assets')
    op.drop_table('users')

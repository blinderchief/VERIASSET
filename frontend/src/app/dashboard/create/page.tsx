'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Coins,
  Gem,
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Shield,
  Info,
  X,
  Plus,
  Image as ImageIcon,
  FileUp,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

type AssetType = 'real_estate' | 'commodity' | 'collectible' | 'financial';

type Step = 1 | 2 | 3 | 4;

interface FormData {
  assetType: AssetType | '';
  name: string;
  description: string;
  location: string;
  valuation: string;
  totalSupply: string;
  documents: File[];
  images: File[];
}

const assetTypes: { type: AssetType; label: string; icon: typeof Building2; color: string; description: string }[] = [
  {
    type: 'real_estate',
    label: 'Real Estate',
    icon: Building2,
    color: 'emerald',
    description: 'Tokenize properties, land, or commercial real estate',
  },
  {
    type: 'commodity',
    label: 'Commodity',
    icon: Coins,
    color: 'amber',
    description: 'Gold, silver, oil, agricultural products',
  },
  {
    type: 'collectible',
    label: 'Collectible',
    icon: Gem,
    color: 'purple',
    description: 'Art, antiques, vintage items, rare collectibles',
  },
  {
    type: 'financial',
    label: 'Financial',
    icon: FileText,
    color: 'blue',
    description: 'Bonds, securities, revenue-generating assets',
  },
];

export default function CreateAssetPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<FormData>({
    assetType: '',
    name: '',
    description: '',
    location: '',
    valuation: '',
    totalSupply: '',
    documents: [],
    images: [],
  });
  const [verificationResult, setVerificationResult] = useState<{
    score: number;
    analysis: string;
    recommendations: string[];
  } | null>(null);

  const verifyMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return {
        score: Math.floor(Math.random() * 20) + 80,
        analysis: 'The asset documentation has been verified using Gemini AI. All required documents are present and appear authentic.',
        recommendations: [
          'Consider adding more recent valuation documents',
          'Insurance documentation would strengthen the verification',
          'Third-party audit report recommended for higher score',
        ],
      };
    },
    onSuccess: (result) => {
      setVerificationResult(result);
      setStep(4);
    },
    onError: () => {
      toast({
        title: 'Verification Failed',
        description: 'Unable to verify asset. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const createAssetMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Simulate API call for demo
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return { id: `asset-${Date.now()}`, name: data.name };
    },
    onSuccess: (asset) => {
      toast({
        title: 'Asset Created!',
        description: 'Your asset has been tokenized and is now live on the marketplace.',
      });
      router.push(`/marketplace/${asset.id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Creation Failed',
        description: error.message || 'Unable to create asset.',
        variant: 'destructive',
      });
    },
  });

  const handleNext = () => {
    if (step === 1 && !formData.assetType) {
      toast({
        title: 'Select Asset Type',
        description: 'Please select an asset type to continue.',
        variant: 'destructive',
      });
      return;
    }

    if (step === 2) {
      if (!formData.name || !formData.description || !formData.valuation || !formData.totalSupply) {
        toast({
          title: 'Missing Information',
          description: 'Please fill in all required fields.',
          variant: 'destructive',
        });
        return;
      }
    }

    if (step === 3) {
      if (formData.documents.length === 0) {
        toast({
          title: 'Documents Required',
          description: 'Please upload at least one verification document.',
          variant: 'destructive',
        });
        return;
      }
      verifyMutation.mutate(formData);
      return;
    }

    setStep((prev) => (prev + 1) as Step);
  };

  const handleBack = () => {
    setStep((prev) => (prev - 1) as Step);
  };

  const handleFileUpload = (files: FileList | null, type: 'documents' | 'images') => {
    if (!files) return;
    const fileArray = Array.from(files);
    setFormData((prev) => ({
      ...prev,
      [type]: [...prev[type], ...fileArray],
    }));
  };

  const removeFile = (index: number, type: 'documents' | 'images') => {
    setFormData((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  };

  const steps = [
    { number: 1, label: 'Asset Type' },
    { number: 2, label: 'Details' },
    { number: 3, label: 'Documents' },
    { number: 4, label: 'Verify' },
  ];

  return (
    <>
      <SignedIn>
        <DashboardLayout>
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-gray-400 hover:text-white mb-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-white mb-2">Create New Asset</h1>
              <p className="text-gray-400">
                Tokenize your real-world asset with AI-powered verification
              </p>
            </div>

                {/* Progress Steps */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    {steps.map((s, i) => (
                      <div key={s.number} className="flex items-center">
                        <div className={cn(
                          'flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all',
                          step >= s.number
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-800 text-gray-500'
                        )}>
                          {step > s.number ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            s.number
                          )}
                        </div>
                        <span className={cn(
                          'ml-2 hidden sm:block',
                          step >= s.number ? 'text-white' : 'text-gray-500'
                        )}>
                          {s.label}
                        </span>
                        {i < steps.length - 1 && (
                          <div className={cn(
                            'w-12 lg:w-24 h-1 mx-4 rounded-full',
                            step > s.number ? 'bg-purple-600' : 'bg-gray-800'
                          )} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Form Card */}
                <Card className="bg-white/5 border-white/10 p-6 lg:p-8">
                  {/* Step 1: Asset Type */}
                  {step === 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h2 className="text-xl font-bold text-white mb-2">Select Asset Type</h2>
                      <p className="text-gray-400 mb-6">
                        Choose the category that best describes your asset
                      </p>

                      <div className="grid md:grid-cols-2 gap-4">
                        {assetTypes.map((type) => (
                          <button
                            key={type.type}
                            onClick={() => setFormData((prev) => ({ ...prev, assetType: type.type }))}
                            className={cn(
                              'p-6 rounded-xl border-2 text-left transition-all',
                              formData.assetType === type.type
                                ? `border-${type.color}-500 bg-${type.color}-500/10`
                                : 'border-white/10 hover:border-white/30 bg-black/20'
                            )}
                          >
                            <type.icon className={cn(
                              'w-10 h-10 mb-3',
                              formData.assetType === type.type
                                ? `text-${type.color}-500`
                                : 'text-gray-500'
                            )} />
                            <h3 className="text-lg font-semibold text-white mb-1">{type.label}</h3>
                            <p className="text-sm text-gray-400">{type.description}</p>
                            {formData.assetType === type.type && (
                              <Badge className={`bg-${type.color}-500/20 text-${type.color}-400 mt-3`}>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Selected
                              </Badge>
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Asset Details */}
                  {step === 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h2 className="text-xl font-bold text-white mb-2">Asset Details</h2>
                      <p className="text-gray-400 mb-6">
                        Provide information about your asset
                      </p>

                      <div className="space-y-6">
                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Asset Name *</label>
                          <Input
                            value={formData.name}
                            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Manhattan Luxury Penthouse"
                            className="bg-black/30 border-white/20 text-white"
                          />
                        </div>

                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Description *</label>
                          <textarea
                            value={formData.description}
                            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                            placeholder="Describe your asset in detail..."
                            rows={4}
                            className="w-full px-4 py-3 bg-black/30 border border-white/20 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <label className="text-sm text-gray-400 mb-2 block">Location</label>
                            <Input
                              value={formData.location}
                              onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                              placeholder="e.g., New York, USA"
                              className="bg-black/30 border-white/20 text-white"
                            />
                          </div>

                          <div>
                            <label className="text-sm text-gray-400 mb-2 block">Valuation (USD) *</label>
                            <Input
                              type="number"
                              value={formData.valuation}
                              onChange={(e) => setFormData((prev) => ({ ...prev, valuation: e.target.value }))}
                              placeholder="1000000"
                              className="bg-black/30 border-white/20 text-white"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm text-gray-400 mb-2 block">Total Token Supply *</label>
                          <Input
                            type="number"
                            value={formData.totalSupply}
                            onChange={(e) => setFormData((prev) => ({ ...prev, totalSupply: e.target.value }))}
                            placeholder="10000"
                            className="bg-black/30 border-white/20 text-white"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Each token will represent a fraction of ownership
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Document Upload */}
                  {step === 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      <h2 className="text-xl font-bold text-white mb-2">Upload Documents</h2>
                      <p className="text-gray-400 mb-6">
                        Upload verification documents and images for AI analysis
                      </p>

                      {/* Documents */}
                      <div className="mb-8">
                        <label className="text-sm text-gray-400 mb-3 block flex items-center gap-2">
                          <FileUp className="w-4 h-4" />
                          Verification Documents *
                        </label>
                        <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-purple-500/50 transition-colors">
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(e.target.files, 'documents')}
                            className="hidden"
                            id="doc-upload"
                          />
                          <label htmlFor="doc-upload" className="cursor-pointer">
                            <Upload className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-400 mb-1">
                              Drag & drop or <span className="text-purple-400">browse</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              Ownership proof, valuation reports, legal documents
                            </p>
                          </label>
                        </div>
                        {formData.documents.length > 0 && (
                          <div className="mt-4 space-y-2">
                            {formData.documents.map((file, i) => (
                              <div key={i} className="flex items-center justify-between bg-black/30 rounded-lg px-4 py-2">
                                <span className="text-gray-400 text-sm truncate">{file.name}</span>
                                <button onClick={() => removeFile(i, 'documents')}>
                                  <X className="w-4 h-4 text-gray-500 hover:text-red-400" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Images */}
                      <div>
                        <label className="text-sm text-gray-400 mb-3 block flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          Asset Images (Optional)
                        </label>
                        <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-purple-500/50 transition-colors">
                          <input
                            type="file"
                            multiple
                            accept=".jpg,.jpeg,.png,.webp"
                            onChange={(e) => handleFileUpload(e.target.files, 'images')}
                            className="hidden"
                            id="img-upload"
                          />
                          <label htmlFor="img-upload" className="cursor-pointer">
                            <ImageIcon className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                            <p className="text-gray-400 mb-1">
                              Drag & drop or <span className="text-purple-400">browse</span>
                            </p>
                            <p className="text-xs text-gray-500">
                              Photos of the asset for marketplace listing
                            </p>
                          </label>
                        </div>
                        {formData.images.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {formData.images.map((file, i) => (
                              <div key={i} className="relative group">
                                <div className="w-20 h-20 bg-gray-800 rounded-lg overflow-hidden">
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <button
                                  onClick={() => removeFile(i, 'images')}
                                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3 text-white" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Info Alert */}
                      <div className="mt-6 bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex gap-3">
                        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-blue-400 font-medium mb-1">AI Verification</p>
                          <p className="text-gray-400 text-sm">
                            Your documents will be analyzed by Google Gemini AI to verify authenticity
                            and assess asset quality. Higher verification scores increase buyer confidence.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 4: Verification Results */}
                  {step === 4 && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                    >
                      {verifyMutation.isPending ? (
                        <div className="text-center py-12">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full mx-auto mb-6"
                          />
                          <h3 className="text-xl font-bold text-white mb-2">Verifying Your Asset</h3>
                          <p className="text-gray-400 mb-4">
                            Gemini AI is analyzing your documents...
                          </p>
                          <div className="flex items-center justify-center gap-2 text-purple-400">
                            <Sparkles className="w-5 h-5" />
                            This may take a moment
                          </div>
                        </div>
                      ) : verificationResult ? (
                        <>
                          <div className="text-center mb-8">
                            <div className={cn(
                              'w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4',
                              verificationResult.score >= 80
                                ? 'bg-green-500/20'
                                : verificationResult.score >= 60
                                ? 'bg-yellow-500/20'
                                : 'bg-red-500/20'
                            )}>
                              {verificationResult.score >= 80 ? (
                                <CheckCircle className="w-10 h-10 text-green-400" />
                              ) : (
                                <AlertCircle className="w-10 h-10 text-yellow-400" />
                              )}
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Verification Complete</h2>
                            <p className="text-gray-400">Your asset has been analyzed by AI</p>
                          </div>

                          {/* Score */}
                          <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-xl p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <p className="text-gray-400 mb-1">Verification Score</p>
                                <p className="text-4xl font-bold text-white">{verificationResult.score}/100</p>
                              </div>
                              <Shield className={cn(
                                'w-16 h-16',
                                verificationResult.score >= 80
                                  ? 'text-green-400'
                                  : 'text-yellow-400'
                              )} />
                            </div>
                            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${verificationResult.score}%` }}
                                transition={{ duration: 1 }}
                                className={cn(
                                  'h-full',
                                  verificationResult.score >= 80
                                    ? 'bg-green-500'
                                    : verificationResult.score >= 60
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                )}
                              />
                            </div>
                          </div>

                          {/* Analysis */}
                          <div className="bg-black/30 rounded-lg p-4 mb-6">
                            <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-400" />
                              AI Analysis
                            </h3>
                            <p className="text-gray-400">{verificationResult.analysis}</p>
                          </div>

                          {/* Recommendations */}
                          {verificationResult.recommendations.length > 0 && (
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                              <h3 className="text-yellow-400 font-semibold mb-3">Recommendations</h3>
                              <ul className="space-y-2">
                                {verificationResult.recommendations.map((rec, i) => (
                                  <li key={i} className="flex items-start gap-2 text-gray-400 text-sm">
                                    <span className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-400 flex items-center justify-center flex-shrink-0 text-xs">
                                      {i + 1}
                                    </span>
                                    {rec}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Asset Summary */}
                          <div className="mt-6 pt-6 border-t border-white/10">
                            <h3 className="text-white font-semibold mb-4">Asset Summary</h3>
                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                              <div className="flex justify-between py-2 border-b border-white/10">
                                <span className="text-gray-400">Name</span>
                                <span className="text-white">{formData.name}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-white/10">
                                <span className="text-gray-400">Type</span>
                                <span className="text-white capitalize">{formData.assetType.replace('_', ' ')}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-white/10">
                                <span className="text-gray-400">Valuation</span>
                                <span className="text-white">${Number(formData.valuation).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-white/10">
                                <span className="text-gray-400">Token Supply</span>
                                <span className="text-white">{Number(formData.totalSupply).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : null}
                    </motion.div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between mt-8 pt-6 border-t border-white/10">
                    {step > 1 && step !== 4 && (
                      <Button variant="outline" onClick={handleBack} className="border-white/20">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                    )}
                    {step === 4 && !verifyMutation.isPending && (
                      <Button variant="outline" onClick={() => setStep(3)} className="border-white/20">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                    )}
                    <div className="ml-auto">
                      {step < 4 && (
                        <Button
                          onClick={handleNext}
                          disabled={verifyMutation.isPending}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {step === 3 ? (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Verify with AI
                            </>
                          ) : (
                            <>
                              Next
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </>
                          )}
                        </Button>
                      )}
                      {step === 4 && verificationResult && (
                        <Button
                          onClick={() => createAssetMutation.mutate(formData)}
                          disabled={createAssetMutation.isPending}
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        >
                          {createAssetMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-2" />
                              Create Asset
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            </DashboardLayout>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}

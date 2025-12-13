import { useState, ChangeEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Brain, CheckCircle, Clock } from "lucide-react";
import axios from 'axios';

interface FacialPrediction {
  success: boolean;
  smile_score: number;
  processing_time: number;
}

interface FacialAnalysisCardProps {
  onAnalysisComplete?: (prediction: FacialPrediction) => void;
}

export const FacialAnalysisCard = ({ onAnalysisComplete }: FacialAnalysisCardProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<FacialPrediction | null>(null);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAnalysis = async () => {
    if (!selectedFile) {
      alert('Please select a video file');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await axios.post(
        'http://localhost:5000/facial/predict/single',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      if (response.data.success) {
        setPrediction(response.data);
        if (onAnalysisComplete) {
          onAnalysisComplete(response.data);
        }
      }
    } catch (error) {
      console.error('Error analyzing facial expressions:', error);
      alert('Error analyzing facial expressions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number): string => {
    if (score >= 0.7) return 'text-green-400';
    if (score >= 0.4) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <Card className="bg-gray-900/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/30 transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Facial Expression Analysis
        </CardTitle>
        <CardDescription className="text-gray-400">
          AI-powered analysis of your facial expressions and engagement
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!prediction ? (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-700 rounded-xl p-6 text-center hover:border-gray-500 transition-colors">
              <Upload className="w-12 h-12 mx-auto text-gray-500 mb-4" />
              <label className="cursor-pointer">
                <span className="text-blue-400 font-medium hover:text-blue-300">
                  Choose video file
                </span>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <p className="text-gray-500 mt-2">
                or drag and drop video file here
              </p>
            </div>
            {selectedFile && (
              <div className="bg-gray-800/30 rounded-lg p-4">
                <h3 className="font-medium text-gray-300 mb-2">
                  Selected File:
                </h3>
                <div className="text-sm text-gray-400">
                  {selectedFile.name}
                </div>
              </div>
            )}
            <Button
              onClick={handleAnalysis}
              disabled={loading || !selectedFile}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-700"
            >
              {loading ? 'Analyzing...' : 'Analyze Facial Expressions'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className={`rounded-lg p-6 ${getScoreColor(prediction.smile_score).replace('text-', 'bg-').replace('400', '900')}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-200 mb-1">
                    Smile Score Analysis
                  </h4>
                  {prediction.processing_time && (
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Processed in {prediction.processing_time.toFixed(2)}s
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getScoreColor(prediction.smile_score)}`}>
                    {(prediction.smile_score * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-400">
                    Engagement Score
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Analysis Complete</span>
              </div>
              <p className="text-sm text-gray-400">
                Your facial expressions have been analyzed successfully. The score above represents your
                overall engagement level based on smile detection and facial feature analysis.
              </p>
            </div>

            <Button
              onClick={() => {
                setPrediction(null);
                setSelectedFile(null);
              }}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white"
            >
              Analyze Another Video
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
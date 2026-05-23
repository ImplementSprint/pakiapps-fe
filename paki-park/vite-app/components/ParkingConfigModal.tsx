import { useState } from 'react';
import { Building2, Grid3x3, Rows, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface ParkingConfig {
  floors: number;
  rows: number;
  columns: number;
}

interface ParkingConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: ParkingConfig) => void;
  currentConfig?: ParkingConfig;
}

export function ParkingConfigModal({ isOpen, onClose, onSave, currentConfig }: ParkingConfigModalProps) {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState<ParkingConfig>(
    currentConfig || {
      floors: 1,
      rows: 3,
      columns: 15,
    }
  );

  if (!isOpen) return null;

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      onSave(config);
      onClose();
      setStep(1);
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const isStepValid = () => {
    if (step === 1) return config.floors >= 1 && config.floors <= 10;
    if (step === 2) return config.rows >= 1 && config.rows <= 26;
    if (step === 3) return config.columns >= 1 && config.columns <= 30;
    return false;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1e3d5a] to-[#2a5373] p-6 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white mb-2">
            {currentConfig ? 'Reconfigure Parking Lot' : 'Set Up Your Parking Lot'}
          </h2>
          <p className="text-white/80 text-sm">
            Step {step} of 3: {step === 1 ? 'Floors' : step === 2 ? 'Rows' : 'Columns'}
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden mt-4">
            <div
              className="bg-[#ee6b20] h-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step 1: Floors */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-16 bg-[#ee6b20] rounded-full flex items-center justify-center">
                  <Building2 className="size-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1e3d5a]">How many floors is your parking lot?</h3>
                  <p className="text-gray-600 text-sm">Choose between 1 to 10 floors</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Floors
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={config.floors}
                  onChange={(e) => setConfig({ ...config, floors: parseInt(e.target.value) || 1 })}
                  className="text-2xl font-bold text-center h-16"
                  placeholder="1"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Each floor will have separate parking grids
                </p>
              </div>

              {/* Visual Preview */}
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Preview:</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: Math.min(config.floors, 10) }).map((_, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 bg-[#1e3d5a] text-white rounded-lg font-semibold text-sm"
                    >
                      {i + 1}F
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Rows */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-16 bg-[#ee6b20] rounded-full flex items-center justify-center">
                  <Rows className="size-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1e3d5a]">How many rows per floor?</h3>
                  <p className="text-gray-600 text-sm">Choose between 1 to 26 rows (A-Z)</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Rows
                </label>
                <Input
                  type="number"
                  min="1"
                  max="26"
                  value={config.rows}
                  onChange={(e) => setConfig({ ...config, rows: parseInt(e.target.value) || 1 })}
                  className="text-2xl font-bold text-center h-16"
                  placeholder="3"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Rows will be labeled alphabetically (A, B, C, etc.)
                </p>
              </div>

              {/* Visual Preview */}
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Preview:</p>
                <div className="space-y-2">
                  {Array.from({ length: Math.min(config.rows, 5) }).map((_, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 bg-[#1e3d5a] text-white rounded-lg font-semibold inline-block mr-2"
                    >
                      Row {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                  {config.rows > 5 && (
                    <span className="text-gray-500 ml-2">...and {config.rows - 5} more</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Columns */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-16 bg-[#ee6b20] rounded-full flex items-center justify-center">
                  <Grid3x3 className="size-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1e3d5a]">How many slots per row?</h3>
                  <p className="text-gray-600 text-sm">Choose between 1 to 30 slots per row</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slots per Row (Columns)
                </label>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  value={config.columns}
                  onChange={(e) => setConfig({ ...config, columns: parseInt(e.target.value) || 1 })}
                  className="text-2xl font-bold text-center h-16"
                  placeholder="15"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Each row will have this many parking slots
                </p>
              </div>

              {/* Configuration Summary */}
              <div className="bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-lg p-6 text-white">
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <CheckCircle className="size-5" />
                  Configuration Summary
                </h4>
                <div className="space-y-2 text-white/90">
                  <p>• <span className="font-semibold">{config.floors}</span> floor{config.floors > 1 ? 's' : ''}</p>
                  <p>• <span className="font-semibold">{config.rows}</span> row{config.rows > 1 ? 's' : ''} per floor</p>
                  <p>• <span className="font-semibold">{config.columns}</span> slot{config.columns > 1 ? 's' : ''} per row</p>
                  <p className="pt-2 border-t border-white/20 mt-3">
                    <span className="font-bold text-[#ee6b20] text-xl">
                      {config.floors * config.rows * config.columns}
                    </span> total parking slots
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t">
            <Button
              onClick={step === 1 ? onClose : handlePrevious}
              variant="outline"
              className="border-[#1e3d5a] text-[#1e3d5a]"
            >
              {step === 1 ? 'Cancel' : 'Previous'}
            </Button>

            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="bg-[#ee6b20] hover:bg-[#d55f1c] text-white gap-2"
            >
              {step === 3 ? (
                <>
                  <CheckCircle className="size-4" />
                  Save Configuration
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="size-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

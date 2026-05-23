import { useState } from 'react';
import { Building2, Grid3x3, Rows, ChevronRight, CheckCircle, AlertCircle, Accessibility, Zap, Crown, Shield, Edit2, Plus, Trash2, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export type SlotCategory = 'regular' | 'pwd' | 'electric' | 'vip' | 'motorcycle' | 'compact';

export interface RowConfig {
  rowLetter: string;
  slotCount: number;
  categories: { [slotNumber: number]: SlotCategory };
}

export interface FloorConfig {
  floor: number;
  rows: RowConfig[];
}

export interface AdvancedParkingConfig {
  floors: number;
  isEvenLayout: boolean;
  evenConfig?: {
    rows: number;
    columns: number;
  };
  floorConfigs?: FloorConfig[];
}

interface AdvancedParkingConfigProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AdvancedParkingConfig) => void;
  currentConfig?: AdvancedParkingConfig;
}

const categoryInfo = {
  regular: { label: 'Regular', icon: Grid3x3, color: 'bg-gray-500', textColor: 'text-gray-700' },
  pwd: { label: 'PWD', icon: Accessibility, color: 'bg-blue-500', textColor: 'text-blue-700' },
  electric: { label: 'Electric Vehicle', icon: Zap, color: 'bg-green-500', textColor: 'text-green-700' },
  vip: { label: 'VIP', icon: Crown, color: 'bg-purple-500', textColor: 'text-purple-700' },
  motorcycle: { label: 'Motorcycle', icon: Shield, color: 'bg-orange-500', textColor: 'text-orange-700' },
  compact: { label: 'Compact', icon: Grid3x3, color: 'bg-teal-500', textColor: 'text-teal-700' },
};

export function AdvancedParkingConfig({ isOpen, onClose, onSave, currentConfig }: AdvancedParkingConfigProps) {
  const [step, setStep] = useState(1);
  const [floors, setFloors] = useState(currentConfig?.floors || 1);
  const [isEvenLayout, setIsEvenLayout] = useState<boolean | null>(null);
  const [evenRows, setEvenRows] = useState(currentConfig?.evenConfig?.rows || 3);
  const [evenColumns, setEvenColumns] = useState(currentConfig?.evenConfig?.columns || 15);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [floorConfigs, setFloorConfigs] = useState<FloorConfig[]>([]);
  const [editingCategories, setEditingCategories] = useState(false);
  const [selectedSlotForCategory, setSelectedSlotForCategory] = useState<{ floor: number; row: string; slot: number } | null>(null);

  if (!isOpen) return null;

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      if (isEvenLayout === null) return;
      
      if (isEvenLayout) {
        // Even layout - initialize floor configs and go to category assignment
        initializeEvenFloorConfigs();
        setStep(4); // Skip step 3, go directly to category assignment
      } else {
        // Uneven layout - go to custom configuration
        initializeFloorConfigs();
        setStep(3);
      }
    } else if (step === 3) {
      // Check if on last floor
      if (currentFloor < floors) {
        setCurrentFloor(currentFloor + 1);
      } else {
        setStep(4); // Go to category assignment
      }
    } else if (step === 4) {
      // Save configuration
      const config: AdvancedParkingConfig = {
        floors,
        isEvenLayout,
        evenConfig: isEvenLayout ? {
          rows: evenRows,
          columns: evenColumns,
        } : undefined,
        floorConfigs,
      };
      onSave(config);
      onClose();
      resetState();
    }
  };

  const handlePrevious = () => {
    if (step === 3 && currentFloor > 1) {
      setCurrentFloor(currentFloor - 1);
    } else if (step === 4) {
      // If even layout, go back to step 2, otherwise go to step 3
      if (isEvenLayout) {
        setStep(2);
      } else {
        setStep(3);
        setCurrentFloor(floors);
      }
    } else if (step > 1) {
      setStep(step - 1);
    }
  };

  const resetState = () => {
    setStep(1);
    setIsEvenLayout(null);
    setCurrentFloor(1);
    setFloorConfigs([]);
    setEditingCategories(false);
    setSelectedSlotForCategory(null);
  };

  const initializeFloorConfigs = () => {
    const configs: FloorConfig[] = [];
    for (let f = 1; f <= floors; f++) {
      configs.push({
        floor: f,
        rows: [
          { rowLetter: 'A', slotCount: 10, categories: {} },
          { rowLetter: 'B', slotCount: 10, categories: {} },
        ],
      });
    }
    setFloorConfigs(configs);
  };

  const initializeEvenFloorConfigs = () => {
    const configs: FloorConfig[] = [];
    for (let f = 1; f <= floors; f++) {
      const rows: RowConfig[] = [];
      for (let r = 0; r < evenRows; r++) {
        const rowLetter = String.fromCharCode(65 + r);
        rows.push({
          rowLetter,
          slotCount: evenColumns,
          categories: {},
        });
      }
      configs.push({
        floor: f,
        rows,
      });
    }
    setFloorConfigs(configs);
  };

  const updateFloorRows = (floorNum: number, rows: RowConfig[]) => {
    setFloorConfigs(prev => 
      prev.map(fc => fc.floor === floorNum ? { ...fc, rows } : fc)
    );
  };

  const addRow = () => {
    const currentConfig = floorConfigs.find(fc => fc.floor === currentFloor);
    if (!currentConfig) return;
    
    const nextLetter = String.fromCharCode(65 + currentConfig.rows.length);
    if (currentConfig.rows.length >= 26) return; // Max 26 rows (A-Z)
    
    const newRow: RowConfig = {
      rowLetter: nextLetter,
      slotCount: 10,
      categories: {},
    };
    
    updateFloorRows(currentFloor, [...currentConfig.rows, newRow]);
  };

  const removeRow = (rowLetter: string) => {
    const currentConfig = floorConfigs.find(fc => fc.floor === currentFloor);
    if (!currentConfig || currentConfig.rows.length <= 1) return;
    
    const newRows = currentConfig.rows.filter(r => r.rowLetter !== rowLetter);
    // Re-letter rows
    const reletteredRows = newRows.map((r, idx) => ({
      ...r,
      rowLetter: String.fromCharCode(65 + idx),
    }));
    
    updateFloorRows(currentFloor, reletteredRows);
  };

  const updateRowSlotCount = (rowLetter: string, count: number) => {
    const currentConfig = floorConfigs.find(fc => fc.floor === currentFloor);
    if (!currentConfig) return;
    
    const newRows = currentConfig.rows.map(r => 
      r.rowLetter === rowLetter ? { ...r, slotCount: Math.max(1, Math.min(30, count)) } : r
    );
    
    updateFloorRows(currentFloor, newRows);
  };

  const setSlotCategory = (floor: number, row: string, slot: number, category: SlotCategory) => {
    setFloorConfigs(prev => 
      prev.map(fc => {
        if (fc.floor !== floor) return fc;
        return {
          ...fc,
          rows: fc.rows.map(r => {
            if (r.rowLetter !== row) return r;
            return {
              ...r,
              categories: { ...r.categories, [slot]: category },
            };
          }),
        };
      })
    );
  };

  const getCurrentFloorConfig = () => {
    return floorConfigs.find(fc => fc.floor === currentFloor);
  };

  const getTotalSlots = () => {
    if (isEvenLayout) {
      return floors * evenRows * evenColumns;
    } else {
      return floorConfigs.reduce((total, fc) => 
        total + fc.rows.reduce((sum, r) => sum + r.slotCount, 0), 0
      );
    }
  };

  const getCategoryCount = (category: SlotCategory) => {
    let count = 0;
    floorConfigs.forEach(fc => {
      fc.rows.forEach(r => {
        Object.values(r.categories).forEach(cat => {
          if (cat === category) count++;
        });
      });
    });
    return count;
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1e3d5a] to-[#2a5373] p-6 rounded-t-3xl">
          <h2 className="text-2xl font-bold text-white mb-2">
            Advanced Parking Configuration
          </h2>
          <p className="text-white/80 text-sm">
            Step {step} of 4: {
              step === 1 ? 'Basic Setup' :
              step === 2 ? 'Layout Type' :
              step === 3 ? `Configure Floor ${currentFloor}` :
              'Assign Categories'
            }
          </p>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden mt-4">
            <div
              className="bg-[#ee6b20] h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {/* Step 1: Floors */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-16 bg-[#ee6b20] rounded-2xl flex items-center justify-center">
                  <Building2 className="size-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1e3d5a]">How many floors?</h3>
                  <p className="text-gray-600 text-sm">Choose between 1 to 10 floors</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Number of Floors
                </label>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  value={floors}
                  onChange={(e) => setFloors(parseInt(e.target.value) || 1)}
                  className="text-2xl font-bold text-center h-16 rounded-xl"
                />
              </div>

              <div className="bg-gray-50 rounded-2xl p-6">
                <p className="text-sm font-medium text-gray-700 mb-3">Preview:</p>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: Math.min(floors, 10) }).map((_, i) => (
                    <div
                      key={i}
                      className="px-4 py-2 bg-[#1e3d5a] text-white rounded-xl font-semibold text-sm"
                    >
                      Floor {i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Even or Uneven Layout */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-16 bg-[#ee6b20] rounded-2xl flex items-center justify-center">
                  <Grid3x3 className="size-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1e3d5a]">Layout Configuration</h3>
                  <p className="text-gray-600 text-sm">Are all rows equal in slot count?</p>
                </div>
              </div>

              {/* Even Layout Question */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-900 mb-1">Important Question</p>
                    <p className="text-sm text-blue-700">
                      Do all rows across all floors have the same number of parking slots?
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsEvenLayout(true)}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    isEvenLayout === true
                      ? 'border-[#ee6b20] bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <CheckCircle className={`size-12 mx-auto mb-3 ${
                    isEvenLayout === true ? 'text-[#ee6b20]' : 'text-gray-400'
                  }`} />
                  <h4 className="font-bold text-[#1e3d5a] mb-2">Yes - Even Layout</h4>
                  <p className="text-sm text-gray-600">
                    All rows have the same number of slots
                  </p>
                </button>

                <button
                  onClick={() => setIsEvenLayout(false)}
                  className={`p-6 rounded-2xl border-2 transition-all ${
                    isEvenLayout === false
                      ? 'border-[#ee6b20] bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Edit2 className={`size-12 mx-auto mb-3 ${
                    isEvenLayout === false ? 'text-[#ee6b20]' : 'text-gray-400'
                  }`} />
                  <h4 className="font-bold text-[#1e3d5a] mb-2">No - Custom Layout</h4>
                  <p className="text-sm text-gray-600">
                    Rows have different slot counts
                  </p>
                </button>
              </div>

              {/* Even Layout Configuration */}
              {isEvenLayout === true && (
                <div className="space-y-4 bg-white border-2 border-gray-200 rounded-2xl p-6">
                  <h4 className="font-bold text-[#1e3d5a] mb-4">Configure Even Layout</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rows per Floor (1-26)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="26"
                        value={evenRows}
                        onChange={(e) => setEvenRows(parseInt(e.target.value) || 1)}
                        className="rounded-xl h-12 text-center font-bold"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Slots per Row (1-30)
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={evenColumns}
                        onChange={(e) => setEvenColumns(parseInt(e.target.value) || 1)}
                        className="rounded-xl h-12 text-center font-bold"
                      />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-xl p-4 text-white">
                    <p className="text-sm mb-1">Total Parking Slots:</p>
                    <p className="text-3xl font-black text-[#ee6b20]">
                      {floors * evenRows * evenColumns}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Custom Floor Configuration */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="size-16 bg-[#ee6b20] rounded-2xl flex items-center justify-center">
                    <Rows className="size-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#1e3d5a]">Configure Floor {currentFloor}</h3>
                    <p className="text-gray-600 text-sm">Set up rows and slot counts for this floor</p>
                  </div>
                </div>
                
                <Button
                  onClick={addRow}
                  className="bg-[#ee6b20] hover:bg-[#d55f1c] text-white rounded-xl"
                >
                  <Plus className="size-4 mr-2" />
                  Add Row
                </Button>
              </div>

              <div className="space-y-3">
                {getCurrentFloorConfig()?.rows.map((row) => (
                  <div key={row.rowLetter} className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
                    <div className="size-10 bg-[#1e3d5a] rounded-lg flex items-center justify-center text-white font-bold">
                      {row.rowLetter}
                    </div>
                    
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Number of Slots in Row {row.rowLetter}
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={row.slotCount}
                        onChange={(e) => updateRowSlotCount(row.rowLetter, parseInt(e.target.value) || 1)}
                        className="rounded-lg h-10"
                      />
                    </div>
                    
                    <Button
                      onClick={() => removeRow(row.rowLetter)}
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={getCurrentFloorConfig()?.rows.length === 1}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-xl p-4 text-white">
                <p className="text-sm mb-1">Floor {currentFloor} Total Slots:</p>
                <p className="text-3xl font-black text-[#ee6b20]">
                  {getCurrentFloorConfig()?.rows.reduce((sum, r) => sum + r.slotCount, 0) || 0}
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Category Assignment */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="size-16 bg-[#ee6b20] rounded-2xl flex items-center justify-center">
                  <Accessibility className="size-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1e3d5a]">Assign Slot Categories</h3>
                  <p className="text-gray-600 text-sm">Designate special parking categories</p>
                </div>
              </div>

              {/* Category Legend */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-sm font-bold text-gray-700 mb-3">Available Categories:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(categoryInfo).map(([key, info]) => {
                    const Icon = info.icon;
                    const count = getCategoryCount(key as SlotCategory);
                    return (
                      <div key={key} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-200">
                        <div className={`size-8 ${info.color} rounded-lg flex items-center justify-center`}>
                          <Icon className="size-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-gray-700 truncate">{info.label}</p>
                          <p className="text-xs text-gray-500">{count} slots</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Floor-by-Floor Category Assignment */}
              <div className="space-y-4">
                {floorConfigs.map((floorConfig) => (
                  <div key={floorConfig.floor} className="bg-white border-2 border-gray-200 rounded-2xl p-4">
                    <h4 className="font-bold text-[#1e3d5a] mb-3">Floor {floorConfig.floor}</h4>
                    
                    <div className="space-y-3">
                      {floorConfig.rows.map((row) => (
                        <div key={row.rowLetter} className="bg-gray-50 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-bold text-gray-700">Row {row.rowLetter}</span>
                            <span className="text-xs text-gray-500">{row.slotCount} slots</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {Array.from({ length: row.slotCount }).map((_, idx) => {
                              const slotNum = idx + 1;
                              const category = row.categories[slotNum] || 'regular';
                              const categoryColor = categoryInfo[category].color;
                              
                              return (
                                <button
                                  key={slotNum}
                                  onClick={() => setSelectedSlotForCategory({ floor: floorConfig.floor, row: row.rowLetter, slot: slotNum })}
                                  className={`size-8 ${categoryColor} rounded-lg text-white text-xs font-bold hover:scale-110 transition-transform`}
                                  title={`${floorConfig.floor}F-${row.rowLetter}${slotNum}`}
                                >
                                  {slotNum}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gradient-to-br from-[#1e3d5a] to-[#2a5373] rounded-xl p-4 text-white">
                <p className="text-sm mb-1">Total Parking Slots:</p>
                <p className="text-3xl font-black text-[#ee6b20]">{getTotalSlots()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between gap-4 p-6 border-t">
          <Button
            onClick={step === 1 ? onClose : handlePrevious}
            variant="outline"
            className="border-[#1e3d5a] text-[#1e3d5a] rounded-xl"
          >
            {step === 1 ? 'Cancel' : 'Previous'}
          </Button>

          <Button
            onClick={handleNext}
            disabled={step === 2 && isEvenLayout === null}
            className="bg-[#ee6b20] hover:bg-[#d55f1c] text-white gap-2 rounded-xl"
          >
            {step === 4 ? (
              <>
                <CheckCircle className="size-4" />
                Save Configuration
              </>
            ) : step === 3 && currentFloor < floors ? (
              <>
                Next Floor
                <ChevronRight className="size-4" />
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

      {/* Category Selection Modal */}
      {selectedSlotForCategory && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1e3d5a]">
                Select Category for Slot {selectedSlotForCategory.floor}F-{selectedSlotForCategory.row}{selectedSlotForCategory.slot}
              </h3>
              <button
                onClick={() => setSelectedSlotForCategory(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="size-5" />
              </button>
            </div>
            
            <div className="space-y-2">
              {Object.entries(categoryInfo).map(([key, info]) => {
                const Icon = info.icon;
                return (
                  <button
                    key={key}
                    onClick={() => {
                      setSlotCategory(
                        selectedSlotForCategory.floor,
                        selectedSlotForCategory.row,
                        selectedSlotForCategory.slot,
                        key as SlotCategory
                      );
                      setSelectedSlotForCategory(null);
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <div className={`size-10 ${info.color} rounded-lg flex items-center justify-center`}>
                      <Icon className="size-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-700">{info.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

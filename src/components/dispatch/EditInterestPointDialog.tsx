import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInterestPoints } from '@/hooks/use-interest-points';
import { InterestPoint, UpdateInterestPointData, INTEREST_POINT_CATEGORIES } from '@/lib/types/interest-point';
import { MapPin } from 'lucide-react';

interface EditInterestPointDialogProps {
  open: boolean;
  onClose: () => void;
  interestPoint: InterestPoint;
  onInterestPointUpdated?: () => void;
}

export function EditInterestPointDialog({
  open,
  onClose,
  interestPoint,
  onInterestPointUpdated
}: EditInterestPointDialogProps) {
  const { updateInterestPoint, isUpdating } = useInterestPoints();
  const [formData, setFormData] = useState<UpdateInterestPointData>({
    name: '',
    description: '',
    category: 'general',
    latitude: 0,
    longitude: 0,
    icon: '📍',
    color: '#FF6B6B'
  });

  useEffect(() => {
    if (interestPoint) {
      setFormData({
        name: interestPoint.name,
        description: interestPoint.description || '',
        category: interestPoint.category,
        latitude: interestPoint.latitude,
        longitude: interestPoint.longitude,
        icon: interestPoint.icon,
        color: interestPoint.color
      });
    }
  }, [interestPoint]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      return;
    }

    try {
      await updateInterestPoint(interestPoint.id, formData);
      onInterestPointUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error updating interest point:', error);
    }
  };

  const handleCategoryChange = (category: string) => {
    const selectedCategory = INTEREST_POINT_CATEGORIES.find(cat => cat.value === category);
    if (selectedCategory) {
      setFormData(prev => ({
        ...prev,
        category: category as any,
        icon: selectedCategory.icon,
        color: selectedCategory.color
      }));
    }
  };

  const handleCoordinateChange = (field: 'latitude' | 'longitude', value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData(prev => ({
        ...prev,
        [field]: numValue
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Edit Interest Point
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-latitude">Latitude</Label>
              <Input
                id="edit-latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => handleCoordinateChange('latitude', e.target.value)}
                placeholder="e.g., 2.0469"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-longitude">Longitude</Label>
              <Input
                id="edit-longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => handleCoordinateChange('longitude', e.target.value)}
                placeholder="e.g., 45.3182"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-name">Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter interest point name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">Category</Label>
            <Select value={formData.category} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {INTEREST_POINT_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-icon">Icon</Label>
              <Input
                id="edit-icon"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="e.g., 🏥"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-16 h-10 p-1"
                />
                <Input
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  placeholder="#FF6B6B"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating || !formData.name?.trim()}>
              {isUpdating ? 'Updating...' : 'Update Interest Point'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

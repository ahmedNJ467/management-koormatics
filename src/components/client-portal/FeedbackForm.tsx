
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FeedbackFormProps {
  tripId: string;
  clientUserId: string;
  onSuccess: () => void;
}

export function FeedbackForm({ tripId, clientUserId, onSuccess }: FeedbackFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ratings, setRatings] = useState({
    overall: 0,
    driver: 0,
    vehicle: 0,
    punctuality: 0,
  });
  const [comments, setComments] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);

  const StarRating = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number; 
    onChange: (rating: number) => void; 
    label: string;
  }) => (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="transition-colors"
          >
            <Star
              className={`h-6 w-6 ${
                star <= value 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "text-gray-300 hover:text-yellow-400"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ratings.overall) {
      toast({
        title: "Rating Required",
        description: "Please provide an overall rating.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from("trip_feedback")
        .insert({
          trip_id: tripId,
          client_user_id: clientUserId,
          rating: ratings.overall,
          driver_rating: ratings.driver,
          vehicle_rating: ratings.vehicle,
          punctuality_rating: ratings.punctuality,
          comments: comments.trim() || null,
          would_recommend: wouldRecommend,
        });

      if (error) throw error;

      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! It helps us improve our service.",
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit feedback.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <StarRating
          label="Overall Experience *"
          value={ratings.overall}
          onChange={(rating) => setRatings(prev => ({ ...prev, overall: rating }))}
        />
        
        <StarRating
          label="Driver Service"
          value={ratings.driver}
          onChange={(rating) => setRatings(prev => ({ ...prev, driver: rating }))}
        />
        
        <StarRating
          label="Vehicle Condition"
          value={ratings.vehicle}
          onChange={(rating) => setRatings(prev => ({ ...prev, vehicle: rating }))}
        />
        
        <StarRating
          label="Punctuality"
          value={ratings.punctuality}
          onChange={(rating) => setRatings(prev => ({ ...prev, punctuality: rating }))}
        />
      </div>

      <div className="space-y-2">
        <Label>Would you recommend our service?</Label>
        <div className="flex gap-4">
          <Button
            type="button"
            variant={wouldRecommend === true ? "default" : "outline"}
            onClick={() => setWouldRecommend(true)}
            size="sm"
          >
            Yes
          </Button>
          <Button
            type="button"
            variant={wouldRecommend === false ? "destructive" : "outline"}
            onClick={() => setWouldRecommend(false)}
            size="sm"
          >
            No
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comments">Additional Comments</Label>
        <Textarea
          id="comments"
          placeholder="Tell us more about your experience..."
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={4}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Feedback"}
        </Button>
      </div>
    </form>
  );
}

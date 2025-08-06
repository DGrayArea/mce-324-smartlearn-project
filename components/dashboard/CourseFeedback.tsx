import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Star, MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CourseFeedbackProps {
  course: {
    id: string;
    name: string;
    code: string;
    instructor: string;
  };
}

const CourseFeedback: React.FC<CourseFeedbackProps> = ({ course }) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [courseRating, setCourseRating] = useState(0);
  const [instructorRating, setInstructorRating] = useState(0);
  const [overallRating, setOverallRating] = useState('');
  const [metExpectations, setMetExpectations] = useState('');
  const [expectationsExplanation, setExpectationsExplanation] = useState('');
  const [valuableAspects, setValuableAspects] = useState('');
  const [improvements, setImprovements] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const StarRating = ({ rating, setRating, label }: { rating: number; setRating: (rating: number) => void; label: string }) => {
    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={cn(
                "transition-colors hover:text-yellow-400",
                star <= rating ? "text-yellow-400" : "text-muted-foreground"
              )}
            >
              <Star className="h-6 w-6 fill-current" />
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {rating > 0 && `${rating} out of 5 stars`}
        </p>
      </div>
    );
  };

  const handleSubmit = () => {
    // Validate required fields
    if (courseRating === 0 || instructorRating === 0 || !overallRating || !metExpectations || !difficulty) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Simulate form submission
    toast({
      title: "Feedback Submitted",
      description: "Thank you for your feedback! It will help improve the course.",
    });

    setIsOpen(false);
    // Reset form
    setCourseRating(0);
    setInstructorRating(0);
    setOverallRating('');
    setMetExpectations('');
    setExpectationsExplanation('');
    setValuableAspects('');
    setImprovements('');
    setDifficulty('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          Course Feedback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Course Feedback</DialogTitle>
          <DialogDescription>
            {course.name} ({course.code}) - {course.instructor}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Star Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StarRating 
              rating={courseRating} 
              setRating={setCourseRating} 
              label="Rate this Course" 
            />
            <StarRating 
              rating={instructorRating} 
              setRating={setInstructorRating} 
              label="Rate the Instructor" 
            />
          </div>

          {/* Overall Rating */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              1. Overall, how would you rate this course? *
            </Label>
            <RadioGroup value={overallRating} onValueChange={setOverallRating}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="poor" id="poor" />
                <Label htmlFor="poor">Poor</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fair" id="fair" />
                <Label htmlFor="fair">Fair</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="good" id="good" />
                <Label htmlFor="good">Good</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="very-good" id="very-good" />
                <Label htmlFor="very-good">Very Good</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excellent" id="excellent" />
                <Label htmlFor="excellent">Excellent</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Learning Expectations */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              2. Did the course meet your learning expectations? *
            </Label>
            <RadioGroup value={metExpectations} onValueChange={setMetExpectations}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="expectations-yes" />
                <Label htmlFor="expectations-yes">Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="expectations-no" />
                <Label htmlFor="expectations-no">No</Label>
              </div>
            </RadioGroup>
            {metExpectations === 'no' && (
              <div className="mt-3">
                <Label htmlFor="expectations-explanation" className="text-sm">
                  Please explain why not:
                </Label>
                <Textarea
                  id="expectations-explanation"
                  value={expectationsExplanation}
                  onChange={(e) => setExpectationsExplanation(e.target.value)}
                  placeholder="Please provide details..."
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Valuable Aspects */}
          <div className="space-y-3">
            <Label htmlFor="valuable-aspects" className="text-sm font-medium">
              3. What were the most valuable aspects of this course?
            </Label>
            <Textarea
              id="valuable-aspects"
              value={valuableAspects}
              onChange={(e) => setValuableAspects(e.target.value)}
              placeholder="Please describe what you found most valuable..."
              rows={3}
            />
          </div>

          {/* Improvements */}
          <div className="space-y-3">
            <Label htmlFor="improvements" className="text-sm font-medium">
              4. What improvements would you suggest for this course?
            </Label>
            <Textarea
              id="improvements"
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              placeholder="Please suggest any improvements..."
              rows={3}
            />
          </div>

          {/* Course Difficulty */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              5. How would you rate the course difficulty? *
            </Label>
            <RadioGroup value={difficulty} onValueChange={setDifficulty}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="too-easy" id="too-easy" />
                <Label htmlFor="too-easy">Too Easy</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="just-right" id="just-right" />
                <Label htmlFor="just-right">Just Right</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="too-difficult" id="too-difficult" />
                <Label htmlFor="too-difficult">Too Difficult</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              <Send className="h-4 w-4 mr-2" />
              Submit Feedback
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseFeedback;
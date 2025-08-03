import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Clock, AlertCircle, Search, Filter, Download, Award, FileText, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ResultApproval {
  id: string;
  studentName: string;
  studentId: string;
  course: string;
  assignment: string;
  submittedGrade: number;
  maxGrade: number;
  submissionDate: string;
  gradedBy: string;
  status: 'pending' | 'approved' | 'rejected' | 'under-review';
  submittedBy: string;
  reviewNotes?: string;
  approvedBy?: string;
  approvalDate?: string;
}

const resultApprovals: ResultApproval[] = [
  {
    id: '1',
    studentName: 'Alice Johnson',
    studentId: 'ST001',
    course: 'CS101',
    assignment: 'Programming Basics Quiz',
    submittedGrade: 88,
    maxGrade: 100,
    submissionDate: '2024-01-15',
    gradedBy: 'Dr. Robert Smith',
    status: 'pending',
    submittedBy: 'Dr. Robert Smith'
  },
  {
    id: '2',
    studentName: 'Bob Smith',
    studentId: 'ST002',
    course: 'CS201',
    assignment: 'Data Structures Project',
    submittedGrade: 92,
    maxGrade: 100,
    submissionDate: '2024-01-10',
    gradedBy: 'Dr. Emily Johnson',
    status: 'approved',
    submittedBy: 'Dr. Emily Johnson',
    approvedBy: 'Dr. Sarah Wilson',
    approvalDate: '2024-01-18'
  },
  {
    id: '3',
    studentName: 'Carol Williams',
    studentId: 'ST003',
    course: 'CS301',
    assignment: 'Database Design Project',
    submittedGrade: 95,
    maxGrade: 100,
    submissionDate: '2024-01-12',
    gradedBy: 'Dr. Michael Brown',
    status: 'under-review',
    submittedBy: 'Dr. Michael Brown',
    reviewNotes: 'Exceptional work, considering for honors recognition'
  },
  {
    id: '4',
    studentName: 'David Brown',
    studentId: 'ST004',
    course: 'CS302',
    assignment: 'Web Development Project',
    submittedGrade: 65,
    maxGrade: 100,
    submissionDate: '2024-01-08',
    gradedBy: 'Dr. Sarah Wilson',
    status: 'rejected',
    submittedBy: 'Dr. Sarah Wilson',
    reviewNotes: 'Grade seems too low for the quality of work submitted. Please review.'
  }
];

const ResultApproval = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedResult, setSelectedResult] = useState<ResultApproval | null>(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    const variants = {
      'pending': 'default',
      'approved': 'outline',
      'rejected': 'destructive',
      'under-review': 'secondary'
    } as const;
    
    return <Badge variant={variants[status as keyof typeof variants]}>{status}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'under-review': return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getGradeColor = (grade: number, maxGrade: number) => {
    const percentage = (grade / maxGrade) * 100;
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredResults = resultApprovals.filter(result => {
    const matchesSearch = result.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         result.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         result.assignment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || result.status === selectedStatus;
    const matchesCourse = selectedCourse === 'all' || result.course === selectedCourse;
    
    return matchesSearch && matchesStatus && matchesCourse;
  });

  const courses = Array.from(new Set(resultApprovals.map(r => r.course)));

  const handleApprove = (resultId: string) => {
    toast({
      title: "Result Approved",
      description: "The grade has been approved and will be published.",
    });
  };

  const handleReject = (resultId: string) => {
    toast({
      title: "Result Rejected",
      description: "The grade has been rejected and sent back for review.",
      variant: "destructive"
    });
  };

  const handleReview = (result: ResultApproval) => {
    setSelectedResult(result);
    setIsReviewOpen(true);
  };

  const handleSubmitReview = () => {
    if (!selectedResult) return;
    
    toast({
      title: "Review Submitted",
      description: "Your review has been recorded and the lecturer has been notified.",
    });
    
    setIsReviewOpen(false);
    setSelectedResult(null);
    setReviewNotes('');
  };

  const pendingCount = resultApprovals.filter(r => r.status === 'pending').length;
  const approvedCount = resultApprovals.filter(r => r.status === 'approved').length;
  const rejectedCount = resultApprovals.filter(r => r.status === 'rejected').length;
  const underReviewCount = resultApprovals.filter(r => r.status === 'under-review').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Result Approval</h2>
          <p className="text-muted-foreground">
            Review and approve student grades before publishing.
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
            <p className="text-xs text-muted-foreground">Published grades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Under Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{underReviewCount}</div>
            <p className="text-xs text-muted-foreground">Being reviewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
            <p className="text-xs text-muted-foreground">Need revision</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search results..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="under-review">Under Review</SelectItem>
          </SelectContent>
        </Select>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map(course => (
              <SelectItem key={course} value={course}>{course}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {filteredResults.map((result) => (
          <Card key={result.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(result.status)}
                    <div>
                      <h3 className="font-semibold text-lg">{result.studentName}</h3>
                      <p className="text-muted-foreground">ID: {result.studentId}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-lg font-bold ${getGradeColor(result.submittedGrade, result.maxGrade)}`}>
                    {result.submittedGrade}/{result.maxGrade}
                  </span>
                  {getStatusBadge(result.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Course</p>
                  <p className="font-medium">{result.course}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assignment</p>
                  <p className="font-medium">{result.assignment}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Graded By</p>
                  <p className="font-medium">{result.gradedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Submission Date</p>
                  <p className="font-medium">{result.submissionDate}</p>
                </div>
              </div>

              {result.reviewNotes && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Review Notes:</p>
                  <p className="text-sm text-muted-foreground">{result.reviewNotes}</p>
                </div>
              )}

              {result.approvedBy && result.approvalDate && (
                <div className="mb-4 text-sm text-muted-foreground">
                  Approved by {result.approvedBy} on {result.approvalDate}
                </div>
              )}

              <div className="flex justify-end space-x-2">
                {result.status === 'pending' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleReview(result)}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Review
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleReject(result.id)}
                    >
                      Reject
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleApprove(result.id)}
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                  </>
                )}
                {result.status === 'under-review' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleReview(result)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Continue Review
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Grade</DialogTitle>
            <DialogDescription>
              {selectedResult && `${selectedResult.studentName} - ${selectedResult.assignment}`}
            </DialogDescription>
          </DialogHeader>
          {selectedResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Student</Label>
                  <p className="text-sm font-medium">{selectedResult.studentName}</p>
                </div>
                <div>
                  <Label>Grade</Label>
                  <p className={`text-sm font-bold ${getGradeColor(selectedResult.submittedGrade, selectedResult.maxGrade)}`}>
                    {selectedResult.submittedGrade}/{selectedResult.maxGrade}
                  </p>
                </div>
              </div>
              <div>
                <Label htmlFor="review-notes">Review Notes</Label>
                <Textarea
                  id="review-notes"
                  placeholder="Add your review comments..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsReviewOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitReview}>
                  Submit Review
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResultApproval;
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Upload, Download, Eye, Plus, Search, Filter, BookOpen, Video, FileImage, File } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ContentItem {
  id: string;
  title: string;
  type: 'document' | 'video' | 'image' | 'presentation' | 'assignment';
  course: string;
  uploadedBy: string;
  uploadDate: string;
  size: string;
  downloads: number;
  description: string;
  tags: string[];
  url?: string;
}

const contentLibrary: ContentItem[] = [
  {
    id: '1',
    title: 'Introduction to Programming Concepts',
    type: 'presentation',
    course: 'CS101',
    uploadedBy: 'Dr. Robert Smith',
    uploadDate: '2024-01-15',
    size: '2.5 MB',
    downloads: 143,
    description: 'Comprehensive slides covering basic programming concepts and paradigms.',
    tags: ['programming', 'basics', 'concepts']
  },
  {
    id: '2',
    title: 'Data Structures Tutorial Video',
    type: 'video',
    course: 'CS201',
    uploadedBy: 'Dr. Emily Johnson',
    uploadDate: '2024-01-18',
    size: '125 MB',
    downloads: 89,
    description: 'Video tutorial explaining arrays, linked lists, and trees.',
    tags: ['data-structures', 'tutorial', 'arrays', 'trees']
  },
  {
    id: '3',
    title: 'Database Design Assignment Template',
    type: 'document',
    course: 'CS301',
    uploadedBy: 'Dr. Michael Brown',
    uploadDate: '2024-01-20',
    size: '450 KB',
    downloads: 67,
    description: 'Template for the database design project with guidelines and examples.',
    tags: ['database', 'assignment', 'template']
  },
  {
    id: '4',
    title: 'Web Development Code Examples',
    type: 'document',
    course: 'CS302',
    uploadedBy: 'Dr. Sarah Wilson',
    uploadDate: '2024-01-22',
    size: '1.8 MB',
    downloads: 92,
    description: 'Collection of HTML, CSS, and JavaScript code examples.',
    tags: ['web-development', 'html', 'css', 'javascript']
  }
];

const ContentLibrary = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'document': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'image': return <FileImage className="h-4 w-4" />;
      case 'presentation': return <BookOpen className="h-4 w-4" />;
      case 'assignment': return <File className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants = {
      'document': 'default',
      'video': 'secondary',
      'image': 'outline',
      'presentation': 'default',
      'assignment': 'destructive'
    } as const;
    
    return <Badge variant={variants[type as keyof typeof variants]}>{type}</Badge>;
  };

  const filteredContent = contentLibrary.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesCourse = selectedCourse === 'all' || item.course === selectedCourse;
    
    return matchesSearch && matchesType && matchesCourse;
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadFile(file);
    }
  };

  const handleUploadSubmit = () => {
    if (!uploadFile) {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive"
      });
      return;
    }

    // Simulate file upload
    toast({
      title: "File Uploaded Successfully",
      description: `${uploadFile.name} has been uploaded to the content library.`,
    });

    setIsUploadOpen(false);
    setUploadFile(null);
  };

  const handleDownload = (item: ContentItem) => {
    // Simulate file download
    toast({
      title: "Download Started",
      description: `Downloading ${item.title}...`,
    });
  };

  const handlePreview = (item: ContentItem) => {
    // Simulate file preview
    toast({
      title: "Preview",
      description: `Opening preview for ${item.title} (demo mode)`,
    });
  };

  const courses = Array.from(new Set(contentLibrary.map(item => item.course)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Content Library</h2>
          <p className="text-muted-foreground">
            Access and manage course materials, resources, and assignments.
          </p>
        </div>
        {(user?.role === 'lecturer' || user?.role === 'admin') && (
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Content
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload New Content</DialogTitle>
                <DialogDescription>Add new files to the content library</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content-title">Title</Label>
                  <Input id="content-title" placeholder="Enter content title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content-type">Content Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="presentation">Presentation</SelectItem>
                      <SelectItem value="assignment">Assignment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content-course">Course</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CS101">CS101</SelectItem>
                      <SelectItem value="CS201">CS201</SelectItem>
                      <SelectItem value="CS301">CS301</SelectItem>
                      <SelectItem value="CS302">CS302</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content-file">File</Label>
                  <Input
                    id="content-file"
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.avi,.jpg,.png,.jpeg"
                  />
                  {uploadFile && (
                    <p className="text-sm text-muted-foreground">
                      Selected: {uploadFile.name} ({(uploadFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content-description">Description</Label>
                  <Textarea id="content-description" placeholder="Describe the content" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content-tags">Tags (comma separated)</Label>
                  <Input id="content-tags" placeholder="e.g., programming, tutorial, basics" />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsUploadOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleUploadSubmit}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Content Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="document">Documents</SelectItem>
            <SelectItem value="video">Videos</SelectItem>
            <SelectItem value="image">Images</SelectItem>
            <SelectItem value="presentation">Presentations</SelectItem>
            <SelectItem value="assignment">Assignments</SelectItem>
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

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContent.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(item.type)}
                  <CardTitle className="text-base">{item.title}</CardTitle>
                </div>
                {getTypeBadge(item.type)}
              </div>
              <CardDescription>{item.course}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{item.description}</p>
              
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <div>Uploaded by {item.uploadedBy}</div>
                <div>{item.uploadDate} • {item.size} • {item.downloads} downloads</div>
              </div>

              <div className="flex space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleDownload(item)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handlePreview(item)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ContentLibrary;
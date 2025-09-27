import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  Search,
  Filter,
  MessageSquare,
  BookOpen,
  GraduationCap,
  Settings,
  CreditCard,
  FileText,
  Users,
  Calendar,
  Award,
} from "lucide-react";
import { withDashboardLayout } from "@/lib/layoutWrappers";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const FAQPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqsByCategory, setFaqsByCategory] = useState<Record<string, FAQ[]>>(
    {}
  );
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const categoryIcons: Record<string, any> = {
    General: HelpCircle,
    Academic: GraduationCap,
    Registration: BookOpen,
    Grades: Award,
    Technical: Settings,
    Account: Users,
    Courses: BookOpen,
    Exams: FileText,
    Library: BookOpen,
    Financial: CreditCard,
  };

  const fetchFAQs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== "ALL") {
        params.append("category", selectedCategory);
      }

      const response = await fetch(`/api/faqs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setFaqs(data.faqs || []);
        setFaqsByCategory(data.faqsByCategory || {});
        setCategories(data.categories || []);
      } else {
        throw new Error("Failed to fetch FAQs");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load FAQs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, toast]);

  useEffect(() => {
    fetchFAQs();
  }, [fetchFAQs]);

  const filteredFAQs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    return matchesSearch;
  });

  const getFilteredFAQsByCategory = () => {
    if (searchTerm) {
      // If searching, group filtered FAQs by category
      const grouped: Record<string, FAQ[]> = {};
      filteredFAQs.forEach((faq) => {
        if (!grouped[faq.category]) {
          grouped[faq.category] = [];
        }
        grouped[faq.category].push(faq);
      });
      return grouped;
    }
    return faqsByCategory;
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading FAQs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 bg-primary/10 rounded-full">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            Find answers to common questions about our platform
          </p>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  {categories.map((category) => {
                    const Icon = categoryIcons[category] || HelpCircle;
                    return (
                      <SelectItem key={category} value={category}>
                        <div className="flex items-center">
                          <Icon className="h-4 w-4 mr-2" />
                          {category}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={fetchFAQs}>
                <Filter className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <div className="text-center">
        <p className="text-muted-foreground">
          {searchTerm ? (
            <>
              Found <strong>{filteredFAQs.length}</strong> FAQ
              {filteredFAQs.length !== 1 ? "s" : ""}
              {selectedCategory !== "ALL" && ` in ${selectedCategory}`}
              {searchTerm && ` matching "${searchTerm}"`}
            </>
          ) : (
            <>
              Showing <strong>{faqs.length}</strong> FAQ
              {faqs.length !== 1 ? "s" : ""}
              {selectedCategory !== "ALL" && ` in ${selectedCategory}`}
            </>
          )}
        </p>
      </div>

      {/* FAQs by Category */}
      {Object.keys(getFilteredFAQsByCategory()).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <HelpCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No FAQs Found</h3>
            <p className="text-muted-foreground">
              {searchTerm || selectedCategory !== "ALL"
                ? "No FAQs match your current search criteria. Try adjusting your search terms or category filter."
                : "No FAQs are available at the moment. Please check back later."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(getFilteredFAQsByCategory())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, categoryFAQs]) => {
              const Icon = categoryIcons[category] || HelpCircle;
              return (
                <Card key={category}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Icon className="h-5 w-5 mr-2 text-primary" />
                      {category}
                      <Badge variant="secondary" className="ml-2">
                        {categoryFAQs.length} FAQ
                        {categoryFAQs.length !== 1 ? "s" : ""}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Common questions about {category.toLowerCase()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {categoryFAQs
                        .sort((a, b) => a.order - b.order)
                        .map((faq) => (
                          <AccordionItem key={faq.id} value={faq.id}>
                            <AccordionTrigger className="text-left">
                              <div className="flex items-start space-x-3">
                                <div className="flex-1">
                                  <p className="font-medium">{faq.question}</p>
                                  {faq.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {faq.tags
                                        .slice(0, 3)
                                        .map((tag, index) => (
                                          <Badge
                                            key={index}
                                            variant="outline"
                                            className="text-xs"
                                          >
                                            {tag}
                                          </Badge>
                                        ))}
                                      {faq.tags.length > 3 && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          +{faq.tags.length - 3} more
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="pt-2">
                                <div className="prose prose-sm max-w-none">
                                  <p className="whitespace-pre-wrap">
                                    {faq.answer}
                                  </p>
                                </div>
                                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                  <div className="flex items-center text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Updated{" "}
                                    {new Date(
                                      faq.updatedAt
                                    ).toLocaleDateString()}
                                  </div>
                                  {faq.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                      {faq.tags.map((tag, index) => (
                                        <Badge
                                          key={index}
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {tag}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* Contact Support */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6 text-center">
          <MessageSquare className="h-8 w-8 text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Still Need Help?</h3>
          <p className="text-muted-foreground mb-4">
            Can&apos;t find what you&apos;re looking for? Our support team is
            here to help.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button variant="outline">Contact Support</Button>
            <Button variant="outline">Submit a Question</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default withDashboardLayout(FAQPage);

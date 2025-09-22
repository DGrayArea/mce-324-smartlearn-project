import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, Send, CheckCircle } from "lucide-react";
import Link from "next/link";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    category: "GENERAL",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();

  const categories = [
    { value: "GENERAL", label: "General Inquiry" },
    { value: "TECHNICAL", label: "Technical Support" },
    { value: "ACADEMIC", label: "Academic Support" },
    { value: "ACCOUNT", label: "Account Issues" },
    { value: "COURSE", label: "Course Related" },
    { value: "GRADES", label: "Grades & Results" },
    { value: "OTHER", label: "Other" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.subject ||
      !formData.message
    ) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast({
          title: "Success",
          description: data.message,
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send message",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending contact form:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                Message Sent Successfully!
              </CardTitle>
              <CardDescription className="text-lg">
                Thank you for contacting us. We&apos;ll get back to you as soon
                as possible.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600">
                We typically respond within 24 hours during business days.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => {
                    setSuccess(false);
                    setFormData({
                      name: "",
                      email: "",
                      subject: "",
                      message: "",
                      category: "GENERAL",
                    });
                  }}
                  variant="outline"
                >
                  Send Another Message
                </Button>
                <Button asChild>
                  <Link href="/">Back to Home</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Have a question or need help? We&apos;re here to assist you. Send us
            a message and we&apos;ll get back to you as soon as possible.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <CardDescription>
                  We&apos;re here to help with any questions or concerns you may
                  have.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">Email</h3>
                    <p className="text-gray-600">support@smartlearn.edu</p>
                    <p className="text-sm text-gray-500">
                      We&apos;ll respond within 24 hours
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">Phone</h3>
                    <p className="text-gray-600">+1 (555) 123-4567</p>
                    <p className="text-sm text-gray-500">Mon-Fri 9AM-5PM EST</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold">Address</h3>
                    <p className="text-gray-600">
                      SmartLearn University
                      <br />
                      123 Education Street
                      <br />
                      Learning City, LC 12345
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link
                  href="/faq"
                  className="block text-primary hover:underline"
                >
                  Frequently Asked Questions
                </Link>
                <Link
                  href="/knowledge-base"
                  className="block text-primary hover:underline"
                >
                  Knowledge Base
                </Link>
                <Link
                  href="/support-tickets"
                  className="block text-primary hover:underline"
                >
                  Support Tickets
                </Link>
                <Link
                  href="/live-chat"
                  className="block text-primary hover:underline"
                >
                  Live Chat Support
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>
                  Fill out the form below and we&apos;ll get back to you as soon
                  as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        placeholder="Your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        handleInputChange("category", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) =>
                        handleInputChange("subject", e.target.value)
                      }
                      placeholder="Brief description of your inquiry"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) =>
                        handleInputChange("message", e.target.value)
                      }
                      placeholder="Please provide as much detail as possible..."
                      rows={6}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    <Send className="h-4 w-4 mr-2" />
                    {loading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

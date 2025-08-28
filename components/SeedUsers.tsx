import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export const SeedUsers = () => {
  const [isLoading, setIsLoading] = useState(false);

  const seedUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/seed-users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: data.message,
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to seed users",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to seed users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-muted/50">
      <h3 className="text-lg font-semibold mb-2">Database Setup</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Create test users for NextAuth authentication
      </p>

      <div className="space-y-3 mb-4">
        <div className="text-xs">
          <p className="font-medium mb-1">
            NextAuth Users (email/password form):
          </p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• alice@university.edu / password123 (Student)</li>
            <li>• robert@university.edu / password123 (Lecturer)</li>
            <li>• admin@university.edu / password123 (Admin)</li>
          </ul>
        </div>

        <div className="text-xs">
          <p className="font-medium mb-1">Dummy Users (demo buttons):</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• student@demo.com / password123 (Student)</li>
            <li>• lecturer@demo.com / password123 (Lecturer)</li>
            <li>• admin@demo.com / password123 (Admin)</li>
          </ul>
        </div>
      </div>

      <Button
        onClick={seedUsers}
        disabled={isLoading}
        variant="outline"
        size="sm"
      >
        {isLoading ? "Creating..." : "Seed Test Users"}
      </Button>
    </div>
  );
};

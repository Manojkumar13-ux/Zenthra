"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { communitySchema } from "@/lib/validations/community.schema";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Loader2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";

interface CreateCommunityFormData {
  name: string;
  description: string;
  image?: string;
}

export function CreateCommunity() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const router = useRouter();
  const queryClient = useQueryClient();

  const form = useForm<CreateCommunityFormData>({
    resolver: zodResolver(communitySchema),
    defaultValues: {
      name: "",
      description: "",
      image: "",
    },
  });

  const onSubmit = async (data: CreateCommunityFormData) => {
    setIsLoading(true);

    try {
      let imageUrl = "";

      // Upload image if exists
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("folder", "communities");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("Failed to upload image");
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      // Create community
      const res = await fetch("/api/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          image: imageUrl || data.image,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create community");
      }

      const community = await res.json();
      toast.success("Community created successfully!");
      setOpen(false);
      form.reset();
      setImageFile(null);
      setImagePreview("");

      queryClient.invalidateQueries({ queryKey: ["communities"] });
      router.push(`/communities/${community._id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create community");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Community
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            Create a Community
          </DialogTitle>
          <DialogDescription>
            Build a community around your interests. Invite members and start conversations.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Community Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Tech Enthusiasts" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormDescription>
                    Choose a unique and descriptive name (3-50 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What is this community about?"
                      {...field}
                      disabled={isLoading}
                      className="resize-none"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>Briefly describe the purpose of your community</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Community Avatar</FormLabel>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={imagePreview} />
                  <AvatarFallback className="bg-indigo-100 text-indigo-600">
                    {form.watch("name")?.[0]?.toUpperCase() || "C"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("image-upload")?.click()}
                      disabled={isLoading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload
                    </Button>
                    {imagePreview && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={removeImage}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                    disabled={isLoading}
                  />
                  <FormDescription className="mt-1 text-xs">
                    Recommended: Square image, max 2MB
                  </FormDescription>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 text-xs">
                  Tip
                </Badge>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Communities with active moderation and clear rules attract more members. Consider
                  assigning moderators after creation.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Community"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

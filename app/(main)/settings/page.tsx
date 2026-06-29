// app/(main)/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  Mail,
  Key,
  Trash2,
  Save,
  Loader2,
  Check,
  X,
  Moon,
  Sun,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AvatarSimple } from "@/components/ui/avatar-simple";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";

interface UserSettings {
  name: string;
  username: string;
  email: string;
  bio: string;
  location: string;
  website: string;
  image?: string;
  theme: string;
  notificationPreferences: {
    email: boolean;
    push: boolean;
    likes: boolean;
    comments: boolean;
    mentions: boolean;
    follows: boolean;
    messages: boolean;
  };
  privacy: {
    isPrivate: boolean;
    showOnlineStatus: boolean;
    allowTagging: boolean;
  };
}

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState<UserSettings>({
    name: "",
    username: "",
    email: "",
    bio: "",
    location: "",
    website: "",
    image: "",
    theme: "system",
    notificationPreferences: {
      email: true,
      push: true,
      likes: true,
      comments: true,
      mentions: true,
      follows: true,
      messages: true,
    },
    privacy: {
      isPrivate: false,
      showOnlineStatus: true,
      allowTagging: true,
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (session?.user) {
      fetchSettings();
    }
  }, [session, status, router]);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/users/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();
      setFormData(data.settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/users/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to update settings");
      }
      await update();
      toast.success("Settings updated successfully!");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleUsernameCheck = async (username: string) => {
    if (!username || username === session?.user?.username) return true;
    try {
      const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      return data.available;
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="privacy">
            <Shield className="mr-2 h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your public profile information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <AvatarSimple
                  src={formData.image}
                  fallback={formData.name || "U"}
                  alt={formData.name || "User"}
                  size="lg"
                />
                <div>
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Recommended: Square image, at least 200x200px
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Input
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="City, Country"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                </div>
                <Switch
                  checked={formData.notificationPreferences.email}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      notificationPreferences: {
                        ...prev.notificationPreferences,
                        email: checked,
                      },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive push notifications in-app</p>
                </div>
                <Switch
                  checked={formData.notificationPreferences.push}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      notificationPreferences: {
                        ...prev.notificationPreferences,
                        push: checked,
                      },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Likes</p>
                  <p className="text-sm text-muted-foreground">When someone likes your post</p>
                </div>
                <Switch
                  checked={formData.notificationPreferences.likes}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      notificationPreferences: {
                        ...prev.notificationPreferences,
                        likes: checked,
                      },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Comments</p>
                  <p className="text-sm text-muted-foreground">
                    When someone comments on your post
                  </p>
                </div>
                <Switch
                  checked={formData.notificationPreferences.comments}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      notificationPreferences: {
                        ...prev.notificationPreferences,
                        comments: checked,
                      },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Mentions</p>
                  <p className="text-sm text-muted-foreground">When someone mentions you</p>
                </div>
                <Switch
                  checked={formData.notificationPreferences.mentions}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      notificationPreferences: {
                        ...prev.notificationPreferences,
                        mentions: checked,
                      },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Follows</p>
                  <p className="text-sm text-muted-foreground">When someone follows you</p>
                </div>
                <Switch
                  checked={formData.notificationPreferences.follows}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      notificationPreferences: {
                        ...prev.notificationPreferences,
                        follows: checked,
                      },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Messages</p>
                  <p className="text-sm text-muted-foreground">When you receive a new message</p>
                </div>
                <Switch
                  checked={formData.notificationPreferences.messages}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      notificationPreferences: {
                        ...prev.notificationPreferences,
                        messages: checked,
                      },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control your privacy preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Private Account</p>
                  <p className="text-sm text-muted-foreground">
                    Only approved followers can see your posts
                  </p>
                </div>
                <Switch
                  checked={formData.privacy.isPrivate}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      privacy: { ...prev.privacy, isPrivate: checked },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Show Online Status</p>
                  <p className="text-sm text-muted-foreground">Let others see when you're online</p>
                </div>
                <Switch
                  checked={formData.privacy.showOnlineStatus}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      privacy: { ...prev.privacy, showOnlineStatus: checked },
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Allow Tagging</p>
                  <p className="text-sm text-muted-foreground">Allow others to tag you in posts</p>
                </div>
                <Switch
                  checked={formData.privacy.allowTagging}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      privacy: { ...prev.privacy, allowTagging: checked },
                    }))
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Theme Preferences</CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={theme} onValueChange={setTheme}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4" />
                        Light
                      </div>
                    </SelectItem>
                    <SelectItem value="dark">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4" />
                        Dark
                      </div>
                    </SelectItem>
                    <SelectItem value="system">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        System
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="mt-6 flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

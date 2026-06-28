// app/(main)/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Loader2, 
  User, 
  Mail, 
  Shield, 
  Bell, 
  Palette, 
  Key, 
  Save, 
  Camera,
  MapPin,
  Link as LinkIcon,
  UserRound,
  Check,
  X
} from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    email: "",
    location: "",
    website: "",
    image: "",
  });

  useEffect(() => {
    setMounted(true);
    if (session?.user) {
      setFormData({
        name: session.user.name || "",
        username: session.user.username || "",
        bio: session.user.bio || "",
        email: session.user.email || "",
        location: session.user.location || "",
        website: session.user.website || "",
        image: session.user.image || "",
      });
    }
  }, [session]);

  // Check if username is available
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setIsUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const res = await fetch(`/api/users/check-username?username=${encodeURIComponent(username)}`, {
        credentials: "include",
      });
      const data = await res.json();
      setIsUsernameAvailable(data.available);
    } catch (error) {
      console.error("Error checking username:", error);
    } finally {
      setCheckingUsername(false);
    }
  };

  // Debounce username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username && formData.username !== session?.user?.username) {
        checkUsernameAvailability(formData.username);
      } else {
        setIsUsernameAvailable(null);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username, session?.user?.username]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if username is taken
      if (formData.username && formData.username !== session?.user?.username) {
        const checkRes = await fetch(`/api/users/check-username?username=${encodeURIComponent(formData.username)}`, {
          credentials: "include",
        });
        const checkData = await checkRes.json();
        if (!checkData.available) {
          toast.error("Username is already taken");
          setLoading(false);
          return;
        }
      }

      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          username: formData.username,
          bio: formData.bio,
          location: formData.location,
          website: formData.website,
          image: formData.image,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update profile");
      }

      const data = await res.json();
      
      // Update session with new data
      await update({
        ...session,
        user: {
          ...session?.user,
          id: session?.user?.id,
          name: data.user.name,
          username: data.user.username,
          bio: data.user.bio,
          image: data.user.image,
          location: data.user.location,
          website: data.user.website,
          email: data.user.email,
        }
      });

      toast.success("Profile updated successfully!");
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error("Update error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="p-12 text-center">
          <h3 className="text-lg font-semibold mb-2">Please Sign In</h3>
          <p className="text-muted-foreground mb-4">Sign in to access settings</p>
          <Button onClick={() => router.push("/login")}>Sign In</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account settings</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Account
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <Card className="p-6">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={formData.image || session.user?.image || undefined} />
                    <AvatarFallback className="text-2xl">
                      {formData.name?.[0]?.toUpperCase() || session.user?.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background"
                    onClick={() => document.getElementById("image-upload")?.click()}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      const formData = new FormData();
                      formData.append("image", file);
                      
                      try {
                        const res = await fetch("/api/users/me/image", {
                          method: "POST",
                          body: formData,
                          credentials: "include",
                        });
                        const data = await res.json();
                        if (data.image) {
                          setFormData(prev => ({ ...prev, image: data.image }));
                          // Update session immediately
                          await update({
                            ...session,
                            user: {
                              ...session?.user,
                              image: data.image,
                            }
                          });
                          toast.success("Profile picture updated!");
                          router.refresh();
                        }
                      } catch (error) {
                        toast.error("Failed to upload image");
                      }
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-semibold">Profile Picture</h3>
                  <p className="text-sm text-muted-foreground">Click the camera icon to change</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Display Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your display name"
                    disabled={loading}
                  />
                </div>

                {/* Username */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="username"
                      className="pl-9"
                      disabled={loading}
                    />
                    {checkingUsername && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!checkingUsername && isUsernameAvailable !== null && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isUsernameAvailable ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <X className="h-4 w-4 text-red-500" />
                        )}
                      </span>
                    )}
                  </div>
                  {isUsernameAvailable === false && (
                    <p className="text-xs text-red-500">Username is already taken</p>
                  )}
                  {isUsernameAvailable === true && (
                    <p className="text-xs text-green-500">Username is available</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={formData.email}
                      disabled
                      className="pl-9 opacity-60"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="City, Country"
                      className="pl-9"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Website */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://example.com"
                      className="pl-9"
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    disabled={loading}
                    maxLength={160}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.bio?.length || 0}/160
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      name: session.user?.name || "",
                      username: session.user?.username || "",
                      bio: session.user?.bio || "",
                      email: session.user?.email || "",
                      location: session.user?.location || "",
                      website: session.user?.website || "",
                      image: session.user?.image || "",
                    });
                  }}
                  disabled={loading}
                >
                  Reset
                </Button>
                <Button type="submit" disabled={loading} className="gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </TabsContent>

        {/* Other tabs remain the same */}
        <TabsContent value="account" className="mt-6">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold">Account Management</h3>
                <p className="text-sm text-muted-foreground">Manage your account settings</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Sign Out</p>
                    <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
                  </div>
                  <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card className="p-6">
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Notification Settings</h3>
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-6">
          <Card className="p-6">
            <div className="text-center py-8">
              <Palette className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Appearance Settings</h3>
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <Card className="p-6">
            <div className="text-center py-8">
              <Key className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Security Settings</h3>
              <p className="text-muted-foreground">Coming soon...</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
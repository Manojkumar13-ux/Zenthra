"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface CommunityCardProps {
  community: {
    _id: string;
    name: string;
    description?: string;
    image?: string;
    members: any[];
    moderators?: any[];
    owner?: any;
    memberCount?: number;
    isMember?: boolean;
  };
  onJoinChange?: (communityId: string, isMember: boolean) => void;
}

export function CommunityCard({ community, onJoinChange }: CommunityCardProps) {
  const { data: session } = useSession();
  const [isMember, setIsMember] = useState(community.isMember || false);
  const [loading, setLoading] = useState(false);
  const memberCount = community.members?.length || community.memberCount || 0;

  const handleJoin = async () => {
    if (!session) {
      toast.error("Please login to join communities");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/communities/${community._id}/join`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to join community");
      const data = await res.json();
      setIsMember(data.isMember);
      if (onJoinChange) onJoinChange(community._id, data.isMember);
      toast.success(data.isMember ? `Joined ${community.name}` : `Left ${community.name}`);
    } catch (error) {
      toast.error("Failed to update membership");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <Link href={`/communities/${community._id}`}>
          <Avatar className="h-14 w-14">
            <AvatarImage src={community.image} />
            <AvatarFallback className="bg-indigo-100 text-indigo-600 text-lg">
              {community.name?.[0]?.toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>
        </Link>
        <div className="flex-1 min-w-0">
          <Link href={`/communities/${community._id}`} className="hover:underline">
            <h3 className="font-semibold text-lg truncate">{community.name}</h3>
          </Link>
          {community.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
              {community.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {memberCount} members
            </span>
          </div>
        </div>
        <Button
          variant={isMember ? "outline" : "default"}
          size="sm"
          onClick={handleJoin}
          disabled={loading}
          className="flex-shrink-0"
        >
          {loading ? (
            <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
          ) : isMember ? (
            "Joined"
          ) : (
            "Join"
          )}
        </Button>
      </div>
    </Card>
  );
}
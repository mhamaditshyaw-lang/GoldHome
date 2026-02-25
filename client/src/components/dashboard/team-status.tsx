import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";
import { User, Location } from "@shared/schema";

interface TeamMemberWithLocation extends User {
  location: Location | null;
  isWorking: boolean;
}

interface TeamStatusProps {
  team?: TeamMemberWithLocation[];
  isLoading: boolean;
}

export default function TeamStatus({ team, isLoading }: TeamStatusProps) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="px-4 py-5 sm:p-6">
          <Skeleton className="h-6 w-24 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="ml-3">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!team || team.length === 0) {
    return (
      <Card>
        <CardContent className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Team Status</h3>
          <div className="mt-6 text-center text-gray-500 text-sm">
            No team members found
          </div>
        </CardContent>
      </Card>
    );
  }

  // Remove duplicates based on user ID
  const uniqueTeam = React.useMemo(() => {
    if (!team) return [];
    const uniqueMembers = new Map();
    team.forEach(member => {
      uniqueMembers.set(member.id, member);
    });
    return Array.from(uniqueMembers.values());
  }, [team]);

  return (
    <Card className="bg-white border-none shadow-sm rounded-[2rem] h-full">
      <CardContent className="px-5 py-5 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-medium text-gray-900">Team Collaboration</h3>
          <Button variant="outline" size="sm" className="rounded-full h-8 text-xs">
            + Add Member
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {uniqueTeam.map((member) => (
            <div key={member.id} className="flex items-center justify-between group">
              <div className="flex items-center min-w-0 flex-1">
                <div className="relative">
                  <img
                    className="h-10 w-10 rounded-xl object-cover"
                    src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=047857&color=fff`}
                    alt={member.name}
                  />
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${member.isWorking ? "bg-emerald-500" : "bg-gray-300"
                    }`} />
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{member.name}</p>
                  <p className="text-xs text-gray-500 truncate">
                    Working on <span className="font-medium text-gray-700">Project Repository</span>
                  </p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-[10px] font-medium uppercase tracking-wide ${member.isWorking
                ? "bg-yellow-50 text-yellow-700 border border-yellow-100"
                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                }`}>
                {member.isWorking ? "In Progress" : "Completed"}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

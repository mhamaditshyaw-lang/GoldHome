import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface StatsCardsProps {
    totalProjects: number;
    endedProjects: number;
    runningProjects: number;
    pendingProjects: number;
    isLoading: boolean;
}

export default function StatsCards({
    totalProjects = 24,
    endedProjects = 10,
    runningProjects = 12,
    pendingProjects = 2,
    isLoading
}: StatsCardsProps) {
    const { t } = useLanguage();

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="h-40 animate-pulse bg-gray-100 border-none" />
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Projects (Green) */}
            <Card className="bg-emerald-800 text-white border-none rounded-[2rem] relative overflow-hidden group">
                <CardContent className="p-6 flex flex-col justify-between h-48">
                    <div className="flex justify-between items-start">
                        <span className="text-emerald-100 font-medium text-lg">Total Projects</span>
                        <div className="w-10 h-10 rounded-full bg-white text-emerald-800 flex items-center justify-center">
                            <ArrowUpRight className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-5xl font-medium mb-2">{totalProjects}</h2>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="bg-emerald-700/50 px-2 py-0.5 rounded text-xs text-white border border-emerald-600">5 ▲</span>
                            <span className="text-emerald-100 opacity-80">Increased from last month</span>
                        </div>
                    </div>
                </CardContent>
                {/* Decorative circles */}
                <div className="absolute -right-4 top-1/2 w-32 h-32 rounded-full border-[30px] border-white/5 opacity-50" />
            </Card>

            {/* Card 2: Ended Projects */}
            <Card className="bg-white border-none shadow-sm rounded-[2rem] hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col justify-between h-48">
                    <div className="flex justify-between items-start">
                        <span className="text-gray-900 font-medium text-lg">Ended Projects</span>
                        <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
                            <ArrowUpRight className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-5xl font-medium mb-2 text-gray-900">{endedProjects}</h2>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600 border border-gray-200">6 ▲</span>
                            <span className="text-gray-500">Increased from last month</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card 3: Running Projects */}
            <Card className="bg-white border-none shadow-sm rounded-[2rem] hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col justify-between h-48">
                    <div className="flex justify-between items-start">
                        <span className="text-gray-900 font-medium text-lg">Running Projects</span>
                        <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
                            <ArrowUpRight className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-5xl font-medium mb-2 text-gray-900">{runningProjects}</h2>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600 border border-gray-200">2 ▲</span>
                            <span className="text-gray-500">Increased from last month</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Card 4: Pending Project */}
            <Card className="bg-white border-none shadow-sm rounded-[2rem] hover:shadow-md transition-shadow">
                <CardContent className="p-6 flex flex-col justify-between h-48">
                    <div className="flex justify-between items-start">
                        <span className="text-gray-900 font-medium text-lg">Pending Project</span>
                        <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
                            <ArrowUpRight className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-5xl font-medium mb-2 text-gray-900">{pendingProjects}</h2>
                        <div className="text-secondary-foreground text-sm font-medium mt-1">
                            On Discuss
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

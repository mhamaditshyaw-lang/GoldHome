import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Project {
    id: number;
    name: string;
    dueDate: string;
    icon: string;
    iconBg: string;
    iconColor: string;
}

const projects: Project[] = [
    {
        id: 1,
        name: "Develop API Endpoints",
        dueDate: "Due date: Nov 26, 2024",
        icon: "//",
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600"
    },
    {
        id: 2,
        name: "Onboarding Flow",
        dueDate: "Due date: Nov 28, 2024",
        icon: "O",
        iconBg: "bg-teal-50",
        iconColor: "text-teal-600"
    },
    {
        id: 3,
        name: "Build Dashboard",
        dueDate: "Due date: Nov 30, 2024",
        icon: "+",
        iconBg: "bg-yellow-50",
        iconColor: "text-yellow-600"
    },
    {
        id: 4,
        name: "Optimize Page Load",
        dueDate: "Due date: Dec 5, 2024",
        icon: "L",
        iconBg: "bg-orange-50",
        iconColor: "text-orange-600"
    },
    {
        id: 5,
        name: "Cross-Browser Testing",
        dueDate: "Due date: Dec 6, 2024",
        icon: "T",
        iconBg: "bg-purple-50",
        iconColor: "text-purple-600"
    }
];

export default function ProjectList() {
    console.log("Rendering ProjectList widget");
    return (
        <Card className="bg-white border-none shadow-sm rounded-[2rem] h-full min-h-[350px]">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-medium">Project</CardTitle>
                <Button variant="outline" size="sm" className="rounded-full h-8 px-4 text-xs font-medium border-gray-200">
                    <Plus className="h-3 w-3 mr-1" /> New
                </Button>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {projects.map((project) => (
                        <div key={project.id} className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer group">
                            <div className={`w-10 h-10 rounded-full ${project.iconBg} ${project.iconColor} flex items-center justify-center font-bold`}>
                                {project.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                                    {project.name}
                                </h4>
                                <p className="text-xs text-gray-500">
                                    {project.dueDate}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
    { name: 'Completed', value: 41, fill: '#047857' }, // Emerald 700
    { name: 'Remaining', value: 59, fill: '#E5E7EB' }, // Gray 200
];

export default function ProgressCircle() {
    return (
        <Card className="bg-white border-none shadow-sm rounded-[2rem] h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Project Progress</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="80%"
                            startAngle={180}
                            endAngle={0}
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={0}
                            dataKey="value"
                            cornerRadius={10}
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} stroke="none" />
                            ))}
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <span className="text-4xl font-bold text-gray-900">41%</span>
                    <p className="text-xs text-gray-500 font-medium">Project Ended</p>
                </div>

                <div className="flex items-center gap-4 mt-[-20px] text-xs font-medium">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-700"></div>
                        <span className="text-gray-600">Completed</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-900"></div>
                        <span className="text-gray-600">In Progress</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-200"></div> // Pattern simplified
                        <span className="text-gray-600">Pending</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, Tooltip, Cell } from "recharts";

const data = [
    { name: 'S', value: 30 },
    { name: 'M', value: 50 },
    { name: 'T', value: 45, active: true },
    { name: 'W', value: 60 },
    { name: 'T', value: 40 },
    { name: 'F', value: 35 },
    { name: 'S', value: 40 },
];

export default function AnalyticsChart() {
    return (
        <Card className="bg-white border-none shadow-sm rounded-[2rem] h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium">Project Analytics</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            dy={10}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="value" radius={[20, 20, 20, 20]} barSize={32}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.active ? '#047857' : (index % 2 === 0 ? '#dbe2e3' : '#10b981')}
                                    fillOpacity={entry.active ? 1 : 0.3}
                                    stroke={entry.active ? 'none' : (index % 2 === 0 ? '#9CA3AF' : 'none')}
                                    strokeDasharray={index % 2 === 0 ? "5 5" : "0"}
                                    strokeWidth={index % 2 === 0 ? 1 : 0}
                                    className="transition-all duration-300 hover:opacity-80"
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

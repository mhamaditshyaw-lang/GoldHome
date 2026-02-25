import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, StopCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function TimeTracker() {
    const [time, setTime] = useState(5048); // 01:24:08 in seconds
    const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isActive) {
            interval = setInterval(() => {
                setTime((time) => time + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        const pad = (num: number) => num.toString().padStart(2, '0');
        return `${pad(h)}:${pad(m)}:${pad(s)}`;
    };

    return (
        <Card className="bg-emerald-900 text-white border-none shadow-sm rounded-[2rem] h-full overflow-hidden relative">
            <CardHeader className="pb-2 relative z-10">
                <CardTitle className="text-lg font-medium text-emerald-100">Time Tracker</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px] flex flex-col justify-center items-center relative z-10">
                <div className="text-5xl font-mono font-bold tracking-wider mb-8">
                    {formatTime(time)}
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setIsActive(!isActive)}
                        className="w-12 h-12 rounded-full bg-white text-emerald-900 flex items-center justify-center hover:bg-emerald-50 transition-colors"
                    >
                        {isActive ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
                    </button>
                    <button className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors">
                        <StopCircle className="w-5 h-5 fill-current" />
                    </button>
                </div>
            </CardContent>

            {/* Decorative background effects */}
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full border-[40px] border-white/5 opacity-30" />
            <div className="absolute top-10 -right-20 w-48 h-48 rounded-full border-[20px] border-white/5 opacity-20" />
        </Card>
    );
}

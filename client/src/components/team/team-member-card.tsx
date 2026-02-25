import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, Coins } from "lucide-react";
import { User, Location } from "@shared/schema";
import { useCurrency } from "@/hooks/use-currency";
import { useLanguage } from "@/contexts/LanguageContext";

interface TeamMemberWithLocation extends User {
  location: Location | null;
  isWorking: boolean;
}

interface TeamMemberCardProps {
  member: TeamMemberWithLocation;
  jobsCount: number;
  totalEarnings: number;
}

export default function TeamMemberCard({ member, jobsCount, totalEarnings }: TeamMemberCardProps) {
  const { formatCurrency } = useCurrency();
  const { t } = useLanguage();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <img
            className="h-12 w-12 rounded-full object-cover"
            src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=D4AF37&color=fff`}
            alt={member.name}
          />
          <div className="flex-1 min-w-0">
            <p className="text-lg font-medium text-gray-900 truncate">
              {member.name}
            </p>
            <div className="flex items-center space-x-2">
              <Badge 
                variant={member.isWorking ? "default" : "secondary"}
                className={member.isWorking ? "bg-green-100 text-green-800" : ""}
              >
                {member.isWorking ? t('tracking.working') : t('dashboard.offDuty')}
              </Badge>
              <Badge variant="outline" className="capitalize">
                {member.role}
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center">
              <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">{t('locations.jobs')}</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">{jobsCount}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center">
              <Coins className="h-4 w-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-500">{t('locations.earnings')}</span>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {formatCurrency(totalEarnings)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex space-x-2">
          <Button 
            variant="outline" 
            className="flex-1"
            disabled={!member.location}
          >
            <MapPin className="h-4 w-4 mr-2" />
            {member.location ? t('teamCard.viewLocation') : t('teamCard.noLocation')}
          </Button>
          <Button variant="outline" size="icon">
            <span className="sr-only">{t('teamCard.moreOptions')}</span>
            •••
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
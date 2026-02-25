import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/use-currency";
import { useWebSocket } from "@/hooks/use-websocket";
import { UserPlus, Search, MapPin, DollarSign, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { User, Location, insertUserSchema } from "@shared/schema";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSettings } from "@/hooks/use-settings";

interface TeamMemberWithLocation extends User {
  location: Location | null;
  isWorking: boolean;
}

const teamMemberSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type TeamMemberFormData = z.infer<typeof teamMemberSchema>;

export default function Team() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { formatCurrency } = useCurrency();
  const { isConnected } = useWebSocket(); // Initialize WebSocket connection
  const { t } = useLanguage();
  const { isPageEnabled, isLoading: settingsLoading } = useSettings();

  // Check if user has access to this page
  useEffect(() => {
    if (!settingsLoading && !isPageEnabled("team")) {
      toast({
        title: t('common.error'),
        description: t('common.accessDenied') || "You don't have access to this page",
        variant: "destructive",
      });
      setLocation("/dashboard");
    }
  }, [isPageEnabled, settingsLoading, setLocation, toast, t]);

  const { data: team, isLoading } = useQuery<TeamMemberWithLocation[]>({
    queryKey: ["/api/team"],
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: false,
  });

  const { data: invoices } = useQuery({
    queryKey: ["/api/invoices"],
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: false,
  });

  const form = useForm<TeamMemberFormData>({
    resolver: zodResolver(teamMemberSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      role: "cleaner",
      avatar: null,
      isActive: true,
      dailySalary: undefined,
    },
  });

  const createTeamMember = useMutation({
    mutationFn: async (data: TeamMemberFormData) => {
      const response = await apiRequest("POST", "/api/users", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setShowCreateDialog(false);
      form.reset();
      toast({
        title: "Success",
        description: "Team member created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TeamMemberFormData) => {
    createTeamMember.mutate(data);
  };

  const filteredTeam = team?.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.username.toLowerCase().includes(searchTerm.toLowerCase())
  ) ?? [];

  const getTeamMemberStats = (memberId: number) => {
    if (!invoices || !Array.isArray(invoices)) return { jobsCount: 0, totalEarnings: 0 };

    const memberInvoices = invoices.filter((invoice: any) => invoice.cleanerId === memberId);
    const jobsCount = memberInvoices.length;
    const totalEarnings = memberInvoices.reduce((sum: number, invoice: any) =>
      sum + parseFloat(invoice.amount), 0);

    return { jobsCount, totalEarnings };
  };

  const handleViewLocation = (member: TeamMemberWithLocation) => {
    if (member.location) {
      // Navigate to tracking page with member filter
      setLocation('/tracking');
    } else {
      toast({
        title: "No Location Available",
        description: `${member.name} is not currently sharing their location.`,
        variant: "destructive",
      });
    }
  };

  const handleEditMember = (member: TeamMemberWithLocation) => {
    toast({
      title: "Edit Member",
      description: "Edit functionality will be implemented soon.",
    });
  };

  const handleDeleteMember = (member: TeamMemberWithLocation) => {
    toast({
      title: "Delete Member",
      description: "Delete functionality will be implemented soon.",
      variant: "destructive",
    });
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Page header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              {t('team.title')}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('team.subtitle')}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  {t('team.addMember')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>{t('team.addNewMember')}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('team.form.username')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('team.form.usernamePlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('team.form.password')}</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder={t('team.form.passwordPlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('team.form.fullName')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('team.form.fullNamePlaceholder')} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('team.form.role')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('team.form.selectRole')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="cleaner">{t('team.roles.cleaner')}</SelectItem>
                              <SelectItem value="supervisor">{t('team.roles.supervisor')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="dailySalary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('team.form.salary')}</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder={t('team.form.salaryPlaceholder')}
                              {...field}
                              value={field.value || ""}
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateDialog(false)}
                      >
                        {t('common.cancel')}
                      </Button>
                      <Button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={createTeamMember.isPending}
                      >
                        {createTeamMember.isPending ? t('common.creating') : t('common.create')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={t('team.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Team members grid */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredTeam.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-500 mb-4">{t('team.noMembersFound')}</div>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <UserPlus className="h-4 w-4 mr-2" />
                {t('team.addFirstMember')}
              </Button>
            </div>
          ) : (
            filteredTeam.map((member) => {
              const stats = getTeamMemberStats(member.id);
              return (
                <Card key={member.id}>
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
                            {member.isWorking ? t('tracking.status.working') : t('team.status.offDuty')}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {t(`team.roles.${member.role}`)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-500">{t('team.stats.jobs')}</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {stats.jobsCount}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-500">{t('team.stats.earnings')}</span>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatCurrency(stats.totalEarnings)}
                        </p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-3">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-amber-600 mr-2" />
                          <span className="text-sm text-amber-700">{t('team.form.salary')}</span>
                        </div>
                        <p className="text-lg font-semibold text-amber-900">
                          {member.dailySalary ? formatCurrency(parseFloat(member.dailySalary)) : '-'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        disabled={!member.location}
                        onClick={() => handleViewLocation(member)}
                      >
                        <MapPin className="h-4 w-4 mr-2" />
                        {member.location ? t('team.actions.viewLocation') : t('team.actions.noLocation')}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t('common.more')}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewLocation(member)}>
                            <Eye className="h-4 w-4 mr-2" />
                            {t('team.actions.viewDetails')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditMember(member)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {t('team.actions.editMember')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteMember(member)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('team.actions.deleteMember')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
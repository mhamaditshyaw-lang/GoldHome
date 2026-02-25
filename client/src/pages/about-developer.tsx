import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Code,
  Mail,
  Phone,
  MapPin,
  Github,
  Linkedin,
  Globe,
  Award,
  Briefcase,
  GraduationCap,
  ArrowLeft,
  Download,
  ExternalLink,
  Star,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";

export default function AboutDeveloper() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  const skills = [
    "React",
    "TypeScript",
    "Node.js",
    "Express",
    "PostgreSQL",
    "WebSockets",
    "Real-time Systems",
    "RESTful APIs",
    "Drizzle ORM",
    "Tailwind CSS",
    "Vite",
    "System Architecture",
    "Database Design",
    "Git",
    "Docker",
    "Linux",
    "CI/CD",
  ];

  const projects = [
    {
      name: "Cleaning Management System",
      description:
        "Enterprise-grade cleaning service management platform with real-time tracking and comprehensive business management tools",
      technologies: [
        "React",
        "Node.js",
        "PostgreSQL",
        "WebSockets",
        "Google Maps API",
        "TypeScript",
      ],
      features: [
        "Real-time GPS location tracking with WebSocket connections",
        "Automated invoice generation and financial reporting",
        "Multi-role access control (Admin, Team, Customer)",
        "Bilingual support (English/Kurdish) with RTL layout",
        "Customer booking system with automated assignments",
        "Team performance analytics and monitoring",
      ],
      highlights: ["Real-time", "Full-Stack", "Production-Ready"],
    },
  ];

  const services = [
    {
      title: "Web Application Development",
      description:
        "Full-stack development of scalable, modern web applications using React, Node.js, and PostgreSQL",
      icon: Code,
    },
    {
      title: "Real-time System Architecture",
      description:
        "Design and implementation of WebSocket-based real-time systems for live tracking and notifications",
      icon: Sparkles,
    },
    {
      title: "Database Design & Optimization",
      description:
        "Enterprise database architecture, query optimization, and data modeling for high-performance applications",
      icon: Award,
    },
    {
      title: "Technical Consultation",
      description:
        "Expert guidance on technology stack selection, system architecture, and best practices implementation",
      icon: Star,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setLocation("/dashboard")}
            variant="outline"
            className="shadow-sm hover:shadow-md transition-shadow"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Hero Profile Card */}
        <Card className="border-2 border-indigo-200 bg-gradient-to-br from-white via-indigo-50 to-blue-50 shadow-xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl -z-0"></div>
          <CardContent className="p-8 md:p-12 relative z-10">
            <div className="flex flex-col items-center md:items-start">
              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left w-full">
                <div className="inline-flex items-center gap-2 mb-3">
                  <Badge
                    variant="secondary"
                    className="bg-indigo-100 text-indigo-700 border-indigo-300"
                  >
                    Available for Projects
                  </Badge>
                </div>

                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-700">
                  Muhammad Sartip
                </h1>

                <p className="text-2xl text-indigo-600 font-semibold mb-4">
                  Full Stack Developer & System Architect
                </p>

                <p className="text-gray-600 text-lg mb-6 max-w-3xl leading-relaxed">
                  Passionate software engineer specializing in building
                  scalable, real-time web applications with modern technologies.
                  Expert in full-stack development, system architecture, and
                  creating user-centric solutions that drive business growth.
                </p>

                {/* Contact Information */}
                <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-6">
                  <a
                    href="mailto:mali.altwini@example.com"
                    className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md"
                  >
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">muhammad.kamo@gmail.com</span>
                  </a>
                  <a
                    href="tel:+9647730250126"
                    className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="font-medium">+9647730250126</span>
                  </a>
                  <div className="flex items-center gap-2 text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm">
                    <MapPin className="h-4 w-4" />
                    <span className="font-medium">Kalar-Kurdistan, Iraq</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center md:justify-start flex-wrap">
                  <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all">
                    <Download className="h-4 w-4 mr-2" />
                    Download CV
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    asChild
                    className="hover:bg-gray-50"
                  >
                    <a
                      href="https://github.com/malialtwini"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Github className="h-4 w-4 mr-2" />
                      GitHub
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    asChild
                    className="hover:bg-blue-50"
                  >
                    <a
                      href="https://linkedin.com/in/malialtwini"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="h-4 w-4 mr-2" />
                      LinkedIn
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    size="default"
                    asChild
                    className="hover:bg-indigo-50"
                  >
                    <a
                      href="https://malialtwini.dev"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Portfolio
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-2 border-indigo-100 hover:border-indigo-300 transition-colors shadow-lg hover:shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Briefcase className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-4xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-700">
                5+
              </h3>
              <p className="text-gray-600 font-medium">Years Experience</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 hover:border-purple-300 transition-colors shadow-lg hover:shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Award className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-4xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                20+
              </h3>
              <p className="text-gray-600 font-medium">Projects Completed</p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100 hover:border-blue-300 transition-colors shadow-lg hover:shadow-xl">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <GraduationCap className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-bold text-4xl mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-600">
                B.Sc
              </h3>
              <p className="text-gray-600 font-medium">Computer Science</p>
            </CardContent>
          </Card>
        </div>

        {/* Technical Skills */}
        <Card className="border-2 border-indigo-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Code className="h-5 w-5 text-white" />
              </div>
              Technical Expertise
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-3">
              {skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="secondary"
                  className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 border-indigo-200 hover:from-indigo-200 hover:to-blue-200 transition-colors cursor-default"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Featured Project */}
        <Card className="border-2 border-indigo-100 shadow-lg overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardTitle className="text-2xl">Featured Project</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {projects.map((project, index) => (
              <div key={index} className="space-y-6">
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-2xl font-bold text-gray-900">
                      {project.name}
                    </h3>
                    <div className="flex gap-2">
                      {project.highlights.map((highlight) => (
                        <Badge
                          key={highlight}
                          className="bg-green-100 text-green-700 border-green-300"
                        >
                          {highlight}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 text-lg leading-relaxed">
                    {project.description}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                    Technologies Used:
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <Badge
                        key={tech}
                        variant="outline"
                        className="border-indigo-300 text-indigo-700 bg-indigo-50 px-3 py-1"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 text-lg">
                    Key Features & Achievements:
                  </h4>
                  <ul className="grid md:grid-cols-2 gap-3">
                    {project.features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-gray-700 bg-white p-3 rounded-lg border border-gray-200"
                      >
                        <span className="text-indigo-600 mt-1 flex-shrink-0">
                          ✓
                        </span>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Services Offered */}
        <Card className="border-2 border-indigo-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardTitle className="text-2xl">Professional Services</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service, idx) => {
                const Icon = service.icon;
                return (
                  <div
                    key={idx}
                    className="p-6 bg-gradient-to-br from-white to-indigo-50 rounded-xl border-2 border-indigo-100 hover:border-indigo-300 transition-all hover:shadow-lg group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2 text-lg">
                          {service.title}
                        </h4>
                        <p className="text-gray-600 leading-relaxed">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className="bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-600 border-0 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCAzLjk5OC00SDU2Yy4wMDIgMCAuMDA0IDAgLjAwNSAwIDIuMjA4IDAgNC00IDMuOTk1LTRoLTE2Yy0yLjIxIDAtNCAxLjc5LTQgNHYxNmMwIDIuMjEgMS43OSA0IDQgNGgxNmMyLjIxIDAgNC0xLjc5IDQtNHYtMTZjMC0yLjIxLTEuNzktNC00LTRINDBjLTIuMjEgMC00IDEuNzktNCA0djE2YzAgMi4yMSAxLjc5IDQgNCA0aDE2YzIuMjEgMCA0LTEuNzkgNC00VjM0eiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>
          <CardContent className="p-12 text-center relative z-10">
            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Let's Build Something Amazing Together
            </h3>
            <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
              Have a project in mind? I'm always interested in hearing about new
              opportunities and challenging projects. Let's discuss how I can
              help bring your vision to life.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Button
                size="lg"
                className="bg-white text-indigo-600 hover:bg-gray-100 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <Mail className="h-5 w-5 mr-2" />
                Send Email
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-indigo-600 transition-all"
              >
                <Phone className="h-5 w-5 mr-2" />
                Schedule Call
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

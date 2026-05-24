"use client";

import dynamic from "next/dynamic";

const HomePage = dynamic(() => import("@/features/pages/HomePage").then((mod) => mod.HomePage));
const SignUpPage = dynamic(() => import("@/features/pages/SignUpPage").then((mod) => mod.SignUpPage));
const LoginPage = dynamic(() => import("@/features/pages/LoginPage").then((mod) => mod.LoginPage));
const ApplicationWaitingPage = dynamic(() => import("@/features/pages/ApplicationWaitingPage").then((mod) => mod.ApplicationWaitingPage));
const ResetPasswordPage = dynamic(() => import("@/features/pages/ResetPasswordPage").then((mod) => mod.ResetPasswordPage));
const CustomerHomePage = dynamic(() => import("@/features/pages/CustomerHomePage").then((mod) => mod.CustomerHomePage));
const DriverHomePage = dynamic(() => import("@/features/pages/DriverHomePage").then((mod) => mod.DriverHomePage));
const OperatorHomePage = dynamic(() => import("@/features/pages/OperatorHomePage").then((mod) => mod.OperatorHomePage));
const SendParcelPage = dynamic(() => import("@/features/pages/SendParcelPage").then((mod) => mod.SendParcelPage));
const TrackPackagePage = dynamic(() => import("@/features/pages/TrackPackagePage").then((mod) => mod.TrackPackagePage));
const HistoryPage = dynamic(() => import("@/features/pages/HistoryPage").then((mod) => mod.HistoryPage));
const RateReviewPage = dynamic(() => import("@/features/pages/RateReviewPage").then((mod) => mod.RateReviewPage));
const AllDeliveriesPage = dynamic(() => import("@/features/pages/AllDeliveriesPage").then((mod) => mod.AllDeliveriesPage));
const EditProfilePage = dynamic(() => import("@/features/pages/EditProfilePage").then((mod) => mod.EditProfilePage));
const DriverProfilePage = dynamic(() => import("@/features/pages/DriverProfilePage").then((mod) => mod.DriverProfilePage));
const OperatorProfilePage = dynamic(() => import("@/features/pages/OperatorProfilePage").then((mod) => mod.OperatorProfilePage));
const CustomerSettingsPage = dynamic(() => import("@/features/pages/CustomerSettingsPage").then((mod) => mod.CustomerSettingsPage));
const DriverSettingsPage = dynamic(() => import("@/features/pages/DriverSettingsPage").then((mod) => mod.DriverSettingsPage));
const OperatorSettingsPage = dynamic(() => import("@/features/pages/OperatorSettingsPage").then((mod) => mod.OperatorSettingsPage));
const CustomerFaqPage = dynamic(() => import("@/features/pages/FaqPage").then((mod) => mod.CustomerFaqPage));
const DriverFaqPage = dynamic(() => import("@/features/pages/FaqPage").then((mod) => mod.DriverFaqPage));
const OperatorFaqPage = dynamic(() => import("@/features/pages/FaqPage").then((mod) => mod.OperatorFaqPage));
const JobDetailsPage = dynamic(() => import("@/features/pages/JobDetailsPage"));
const UpdateParcelStatusPage = dynamic(() => import("@/features/pages/UpdateParcelStatusPage"));
const ReceiveParcelPage = dynamic(() => import("@/features/pages/ReceiveParcelPage").then((mod) => mod.ReceiveParcelPage));
const NotFoundPage = dynamic(() => import("@/features/pages/NotFoundPage").then((mod) => mod.NotFoundPage));

type Match = {
  component: React.ComponentType;
  params: Record<string, string>;
};

type StaticRoute = {
  path: string;
  component: React.ComponentType;
};

type DynamicRoute = {
  pattern: RegExp;
  getParams: (match: RegExpExecArray) => Record<string, string>;
  component: React.ComponentType;
};

const staticRoutes: StaticRoute[] = [
  { path: "/", component: HomePage },
  { path: "/signup", component: SignUpPage },
  { path: "/login", component: LoginPage },
  { path: "/application/waiting", component: ApplicationWaitingPage },
  { path: "/reset-password", component: ResetPasswordPage },
  { path: "/customer/home", component: CustomerHomePage },
  { path: "/customer/edit-profile", component: EditProfilePage },
  { path: "/customer/settings", component: CustomerSettingsPage },
  { path: "/customer/faq", component: CustomerFaqPage },
  { path: "/customer/send-parcel", component: SendParcelPage },
  { path: "/customer/track-package", component: TrackPackagePage },
  { path: "/customer/history", component: HistoryPage },
  { path: "/customer/rate-review", component: RateReviewPage },
  { path: "/customer/all-deliveries", component: AllDeliveriesPage },
  { path: "/driver/home", component: DriverHomePage },
  { path: "/driver", component: DriverHomePage },
  { path: "/driver/profile", component: DriverProfilePage },
  { path: "/driver/settings", component: DriverSettingsPage },
  { path: "/driver/faq", component: DriverFaqPage },
  { path: "/operator/home", component: OperatorHomePage },
  { path: "/operator/profile", component: OperatorProfilePage },
  { path: "/operator/settings", component: OperatorSettingsPage },
  { path: "/operator/faq", component: OperatorFaqPage },
  { path: "/operator/receive-parcel", component: ReceiveParcelPage },
];

const dynamicRoutes: DynamicRoute[] = [
  {
    pattern: /^\/customer\/transaction\/([^/]+)$/,
    getParams: (match) => ({ id: match[1] }),
    component: TrackPackagePage,
  },
  {
    pattern: /^\/driver\/job\/([^/]+)$/,
    getParams: (match) => ({ jobId: match[1] }),
    component: JobDetailsPage,
  },
  {
    pattern: /^\/driver\/job\/([^/]+)\/update-status$/,
    getParams: (match) => ({ jobId: match[1] }),
    component: UpdateParcelStatusPage,
  },
];

export function resolveRoute(pathname: string): Match {
  const staticMatch = staticRoutes.find((route) => route.path === pathname);
  if (staticMatch) {
    return { component: staticMatch.component, params: {} };
  }

  for (const route of dynamicRoutes) {
    const match = route.pattern.exec(pathname);
    if (match) {
      return {
        component: route.component,
        params: route.getParams(match),
      };
    }
  }

  return { component: NotFoundPage, params: {} };
}

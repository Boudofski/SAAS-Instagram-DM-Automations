import {
  getAllAutomation,
  getAutomationInfo,
  getProfilePosts,
} from "@/actions/automation";
import { onUserInfo } from "@/actions/user";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

export const useQueryAutomation = () => {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["user-automation", userId],
    queryFn: getAllAutomation,
    enabled: Boolean(userId),
  });
};

export const useQueryAutomations = (id: string, enabled = true) => {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["automation-info", userId, id],
    queryFn: () => getAutomationInfo(id),
    enabled: enabled && Boolean(userId) && Boolean(id),
  });
};

export const useQueryUser = () => {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["user-profile", userId],
    queryFn: onUserInfo,
    enabled: Boolean(userId),
  });
};

export const useQueryAutomationPosts = () => {
  const { userId } = useAuth();
  const fetchPosts = async () => await getProfilePosts();

  return useQuery({
    queryKey: ["instagram-media", userId],
    queryFn: fetchPosts,
    enabled: Boolean(userId),
  });
};

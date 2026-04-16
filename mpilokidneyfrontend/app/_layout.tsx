import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router, useRootNavigationState } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthStack() {
  const { isAuthenticated, isLoading: authLoading, isAdmin } = useAuth();
  const { onboardingComplete, isLoading } = useApp();
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!isLoading && navigationState?.key) {
      SplashScreen.hideAsync();
      if (onboardingComplete === false) {
        router.replace('/onboarding');
      }
    }
  }, [isLoading, onboardingComplete, navigationState?.key]);

  if (authLoading || isLoading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding"
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen
        name="login"
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="register"
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <Stack.Screen
        name="admin"
        options={{ headerShown: false }}
      />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function RootLayoutNav() {
  return <AuthStack />;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <AppProvider>
            <StatusBar style="auto" />
            <RootLayoutNav />
          </AppProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

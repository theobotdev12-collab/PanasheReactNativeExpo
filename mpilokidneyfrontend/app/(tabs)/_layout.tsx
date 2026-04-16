import { Tabs } from 'expo-router';
import { Home, ScanLine, ShoppingBag, BookOpen, User } from 'lucide-react-native';
import { useWindowDimensions, Platform } from 'react-native';
import Colors from '@/constants/colors';

export default function TabLayout() {
  const { width } = useWindowDimensions();
  const isSmall = width < 360;
  const iconSize = isSmall ? 20 : 24;

    return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          minHeight: Platform.select({ web: 56, default: undefined }),
        },
        tabBarLabelStyle: {
          fontSize: isSmall ? 9 : 11,
          fontWeight: '600' as const,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: isSmall ? 4 : 6,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: 'Analyze',
          tabBarIcon: ({ color }) => <ScanLine size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{
          title: 'Market',
          tabBarIcon: ({ color }) => <ShoppingBag size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="education"
        options={{
          title: 'Learn',
          tabBarIcon: ({ color }) => <BookOpen size={iconSize} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <User size={iconSize} color={color} />,
        }}
      />
    </Tabs>
  );
}
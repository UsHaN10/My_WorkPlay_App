import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

import { useAuth } from '../../context/AuthContext';
import { Home, Settings, Trophy, Store, Activity, LogOut, Star } from 'lucide-react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const auth = useAuth(); // Retrieve the current user from auth context safely
  const user = auth?.user;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: useClientOnlyValue(false, true),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="play" color={color} />,
          headerRight: () => (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Pressable onPress={auth?.logout} style={{ marginRight: 20 }}>
                {({ pressed }) => (
                  <LogOut
                    size={24}
                    color={Colors[colorScheme ?? 'light'].text}
                    style={{ opacity: pressed ? 0.5 : 1 }}
                  />
                )}
              </Pressable>
              <Link href="/modal" asChild>
                <Pressable>
                  {({ pressed }) => (
                    <FontAwesome
                      name="info-circle"
                      size={25}
                      color={Colors[colorScheme ?? 'light'].text}
                      style={{ marginRight: 15, opacity: pressed ? 0.5 : 1 }}
                    />
                  )}
                </Pressable>
              </Link>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ranks"
        options={{
          title: 'Ranks',
          tabBarIcon: ({ color }) => <Star size={28} color={color} />,
          href: user?.role === 'admin' ? null : '/ranks',
        }}
      />
      <Tabs.Screen
        name="leaderboard"
        options={{
          title: 'Leaderboard',
          tabBarIcon: ({ color }) => <Trophy size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color }) => <Store size={28} color={color} />,
          href: user?.role === 'admin' ? null : '/shop',
        }}
      />
      <Tabs.Screen
        name="skills"
        options={{
          title: 'Skills',
          tabBarIcon: ({ color }) => <Activity size={28} color={color} />,
          href: user?.role === 'admin' ? null : '/skills',
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin Hub',
          tabBarIcon: ({ color }) => <TabBarIcon name="lock" color={color} />,
          // Only show this tab if the user is an admin
          href: user?.role === 'admin' ? '/admin' : null,
        }}
      />
    </Tabs>
  );
}

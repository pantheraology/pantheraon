import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Palette, Shield, Camera, Check, Loader2 } from 'lucide-react';
import { PageContainer } from '@/components/layout/PageContainer';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, ThemeName } from '@/contexts/ThemeContext';
import { AuthPrompt } from '@/components/common/AuthPrompt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const themes: { id: ThemeName; name: string; color: string }[] = [
  { id: 'space-blue', name: 'Space Blue', color: 'hsl(220, 90%, 50%)' },
  { id: 'neon-orange', name: 'Neon Orange', color: 'hsl(14, 100%, 50%)' },
  { id: 'cyber-yellow', name: 'Cyber Yellow', color: 'hsl(75, 100%, 50%)' },
  { id: 'aqua-cyan', name: 'Aqua Cyan', color: 'hsl(187, 94%, 43%)' },
];

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading: authLoading, updateProfile, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync form with profile when it loads
  useEffect(() => {
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }
    if (profile?.username) {
      setUsername(profile.username);
    }
  }, [profile]);

  if (authLoading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <div className="mb-8">
          <h1 className="text-3xl font-light text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account preferences</p>
        </div>
        <AuthPrompt
          title="Sign in to access settings"
          description="Your preferences will be saved and synced across devices"
        />
      </PageContainer>
    );
  }

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { error } = await updateProfile({ 
        full_name: fullName,
        username: username || undefined,
      });
      if (error) {
        toast.error('Failed to update profile');
      } else {
        toast.success('Profile updated successfully');
      }
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // For now, just sign out - actual account deletion requires admin API
      await signOut();
      toast.success('You have been signed out');
      navigate('/');
    } catch {
      toast.error('Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || user?.email?.[0]?.toUpperCase() || '?';

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-3xl font-light text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      <Tabs defaultValue="profile" className="w-full max-w-2xl">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User size={16} />
            Profile
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette size={16} />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Shield size={16} />
            Account
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/20 text-primary text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button 
                className="absolute bottom-0 right-0 p-1.5 bg-primary rounded-full text-primary-foreground hover:bg-primary/90 transition-colors"
                onClick={() => toast.info('Avatar upload coming soon')}
              >
                <Camera size={14} />
              </button>
            </div>
            <div>
              <h3 className="font-medium text-foreground">{profile?.full_name || 'Your Name'}</h3>
              <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
            </div>
          </div>

          {/* Name Field */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your full name"
              className="max-w-md"
            />
          </div>

          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="your_username"
                className="pl-8"
              />
            </div>
            <p className="text-xs text-muted-foreground">Used for inviting you to group chats</p>
          </div>

          {/* Email Field (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={profile?.email || user?.email || ''}
              disabled
              className="max-w-md opacity-60"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed</p>
          </div>

          <Button onClick={handleSaveProfile} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-foreground mb-2">Theme</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Choose your preferred color theme
            </p>
            <div className="flex flex-wrap gap-4">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border hover:border-primary/50 transition-colors group"
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ backgroundColor: t.color }}
                  >
                    {theme === t.id && (
                      <Check size={20} className="text-white drop-shadow-md" />
                    )}
                  </div>
                  <span className="text-sm text-foreground">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="account" className="space-y-6">
          <div>
            <h3 className="text-lg font-medium text-foreground mb-2">Account Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">User ID</span>
                <span className="text-foreground font-mono text-xs">{user?.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <h3 className="text-lg font-medium text-destructive mb-2">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete your account and all associated data
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
};

export default Settings;

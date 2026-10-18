import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Camera, Save, Loader2, User, BookOpen, Trophy, Clock, Target,
  KeyRound, Trash2, CheckCircle2, Bell
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  display_name: string | null;
  bio: string | null;
  phone: string | null;
  avatar_url: string | null;
  notify_new_content: boolean;
  notify_interview_reminders: boolean;
  notify_progress_updates: boolean;
  notify_tips_resources: boolean;
}

interface LearningStats {
  totalCompleted: number;
  pathProgress: { pathId: string; pathTitle: string; completed: number; total: number }[];
}

export default function ProfilePage() {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ display_name: "", bio: "", phone: "" });

  // Interview stats
  const [interviewCount, setInterviewCount] = useState(0);
  const [avgScore, setAvgScore] = useState(0);
  const [totalHours, setTotalHours] = useState(0);

  // Learning stats
  const [learningStats, setLearningStats] = useState<LearningStats>({ totalCompleted: 0, pathProgress: [] });

  // Password change
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Notification preferences
  const [notifications, setNotifications] = useState({
    notify_new_content: true,
    notify_interview_reminders: true,
    notify_progress_updates: true,
    notify_tips_resources: false,
  });
  const [savingNotifications, setSavingNotifications] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setEmail(user.email || "");

    // Profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (prof) {
      setProfile(prof);
      setForm({
        display_name: prof.display_name || "",
        bio: prof.bio || "",
        phone: prof.phone || "",
      });
      setNotifications({
        notify_new_content: prof.notify_new_content ?? true,
        notify_interview_reminders: prof.notify_interview_reminders ?? true,
        notify_progress_updates: prof.notify_progress_updates ?? true,
        notify_tips_resources: prof.notify_tips_resources ?? false,
      });
    } else {
      // Create profile if it doesn't exist (for existing users)
      const { data: newProf } = await supabase
        .from("profiles")
        .insert({ id: user.id, display_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "" })
        .select()
        .single();
      if (newProf) {
        setProfile(newProf);
        setForm({ display_name: newProf.display_name || "", bio: "", phone: "" });
      }
    }

    // Interview stats
    const { data: interviews } = await supabase
      .from("interviews")
      .select("overall_score, duration_seconds")
      .eq("user_id", user.id);
    if (interviews && interviews.length > 0) {
      setInterviewCount(interviews.length);
      setAvgScore(Math.round(interviews.reduce((s, i) => s + i.overall_score, 0) / interviews.length));
      setTotalHours(+(interviews.reduce((s, i) => s + (i.duration_seconds || 0), 0) / 3600).toFixed(1));
    }

    // Learning progress
    const { data: progress } = await supabase
      .from("learning_progress")
      .select("path_id, topic_id")
      .eq("user_id", user.id)
      .eq("completed", true);

    if (progress) {
      const { learningPaths } = await import("@/data/learningPaths");
      const { learningContent } = await import("@/data/learningContent");
      const pathMap = new Map<string, { completed: Set<string>; total: number; title: string }>();

      learningPaths.forEach((p) => {
        const content = learningContent.find((c) => c.pathId === p.id);
        const total = content ? content.modules.reduce((a, m) => a + m.topics.reduce((b, t) => b + t.lessons.length, 0), 0) : 0;
        pathMap.set(p.id, { completed: new Set(), total, title: p.title });
      });

      progress.forEach((r) => {
        const entry = pathMap.get(r.path_id);
        if (entry) entry.completed.add(r.topic_id);
      });

      const pathProgress = Array.from(pathMap.entries())
        .filter(([, v]) => v.completed.size > 0)
        .map(([pathId, v]) => ({ pathId, pathTitle: v.title, completed: v.completed.size, total: v.total }));

      setLearningStats({
        totalCompleted: progress.length,
        pathProgress,
      });
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: form.display_name.trim(),
        bio: form.bio.trim(),
        phone: form.phone.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    setSaving(false);
    if (error) {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Profile updated successfully." });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Too large", description: "Avatar must be under 2MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${profile.id}/avatar.${ext}`;

    const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadErr) {
      toast({ title: "Upload failed", description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ avatar_url: avatarUrl, updated_at: new Date().toISOString() }).eq("id", profile.id);
    setProfile({ ...profile, avatar_url: avatarUrl });
    setUploading(false);
    toast({ title: "Avatar updated" });
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast({ title: "Too short", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password changed", description: "Your password has been updated." });
      setNewPassword("");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = (form.display_name || email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container mx-auto py-8 px-4 max-w-3xl pt-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-2xl font-bold text-foreground mb-8">My Profile</h1>
        </motion.div>

        {/* Avatar + Basic Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="glass-card rounded-2xl p-6 md:p-8 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 border-2 border-primary/20">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <Camera className="h-5 w-5 text-white" />}
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="font-display text-xl font-bold text-foreground">{form.display_name || "Unnamed"}</h2>
              <p className="text-sm text-muted-foreground">{email}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div>
              <Label htmlFor="display_name">Display Name</Label>
              <Input id="display_name" value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} maxLength={100} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} maxLength={20} placeholder="+1 234 567 890" />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={500} rows={3} placeholder="Tell us about yourself..." />
              <p className="text-xs text-muted-foreground mt-1">{form.bio.length}/500</p>
            </div>
            <Button variant="hero" size="sm" onClick={handleSave} disabled={saving} className="w-fit">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Save Changes
            </Button>
          </div>
        </motion.div>

        {/* Learning & Interview Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6 md:p-8 mb-6"
        >
          <h3 className="font-display text-lg font-bold text-foreground mb-5 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" /> Stats & Progress
          </h3>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 rounded-xl bg-primary/5">
              <Target className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{interviewCount}</p>
              <p className="text-xs text-muted-foreground">Interviews</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-primary/5">
              <Trophy className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{avgScore}</p>
              <p className="text-xs text-muted-foreground">Avg Score</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-primary/5">
              <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{totalHours}h</p>
              <p className="text-xs text-muted-foreground">Practice</p>
            </div>
          </div>

          {learningStats.pathProgress.length > 0 && (
            <>
              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" /> Learning Progress
              </h4>
              <div className="space-y-3">
                {learningStats.pathProgress.map((p) => {
                  const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
                  return (
                    <div key={p.pathId}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-foreground font-medium">{p.pathTitle}</span>
                        <span className="text-muted-foreground">{p.completed}/{p.total} lessons · {pct}%</span>
                      </div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent" />
                {learningStats.totalCompleted} total lessons completed
              </p>
            </>
          )}

          {learningStats.pathProgress.length === 0 && (
            <p className="text-sm text-muted-foreground">No learning progress yet. <Link to="/learning" className="text-primary hover:underline">Start learning →</Link></p>
          )}
        </motion.div>

        {/* Notification Preferences */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}
          className="glass-card rounded-2xl p-6 md:p-8 mb-6"
        >
          <h3 className="font-display text-lg font-bold text-foreground mb-5 flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Notification Preferences
          </h3>
          <p className="text-sm text-muted-foreground mb-5">Choose which email notifications you'd like to receive.</p>

          <div className="space-y-4">
            {[
              { key: "notify_new_content" as const, label: "New Learning Content", desc: "Get notified when new courses or learning paths are added" },
              { key: "notify_interview_reminders" as const, label: "Interview Reminders", desc: "Receive reminders to practice and take mock interviews" },
              { key: "notify_progress_updates" as const, label: "Progress Updates", desc: "Weekly summary of your learning progress and scores" },
              { key: "notify_tips_resources" as const, label: "Tips & Resources", desc: "Curated tips, articles, and resources to boost your preparation" },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <Switch
                  checked={notifications[item.key]}
                  onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [item.key]: checked }))}
                />
              </div>
            ))}
          </div>

          <Separator className="my-5" />

          <Button
            variant="hero"
            size="sm"
            disabled={savingNotifications}
            onClick={async () => {
              if (!profile) return;
              setSavingNotifications(true);
              const { error } = await supabase
                .from("profiles")
                .update({
                  notify_new_content: notifications.notify_new_content,
                  notify_interview_reminders: notifications.notify_interview_reminders,
                  notify_progress_updates: notifications.notify_progress_updates,
                  notify_tips_resources: notifications.notify_tips_resources,
                  updated_at: new Date().toISOString(),
                })
                .eq("id", profile.id);
              setSavingNotifications(false);
              if (error) {
                toast({ title: "Error", description: "Failed to save preferences.", variant: "destructive" });
              } else {
                toast({ title: "Saved", description: "Notification preferences updated." });
              }
            }}
          >
            {savingNotifications ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Save Preferences
          </Button>
        </motion.div>

        {/* Account Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="glass-card rounded-2xl p-6 md:p-8"
        >
          <h3 className="font-display text-lg font-bold text-foreground mb-5 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" /> Account Settings
          </h3>

          <div className="mb-6">
            <Label htmlFor="email-display">Email</Label>
            <Input id="email-display" value={email} disabled className="bg-muted/50" />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed.</p>
          </div>

          <Separator className="mb-6" />

          <div className="mb-6">
            <Label htmlFor="new-password">Change Password</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                maxLength={50}
              />
              <Button variant="heroOutline" size="sm" onClick={handlePasswordChange} disabled={changingPassword || !newPassword}>
                {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
              </Button>
            </div>
          </div>

          <Separator className="mb-6" />

          <Button variant="destructive" size="sm" onClick={handleSignOut}>
            Sign Out
          </Button>
        </motion.div>
      </div>
    </div>
  );
}

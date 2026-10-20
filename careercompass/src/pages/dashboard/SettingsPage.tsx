import { Card, Button, Input } from '../../components/ui'
import { User, Mail, Bell, Shield } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Settings</h2>
        <p className="text-slate-400 text-sm">Manage your account and preferences.</p>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-brand-400" />
          <h3 className="text-white font-semibold">Profile</h3>
        </div>
        <div className="space-y-4">
          <Input label="Full Name" defaultValue="User" leftIcon={<User size={16}/>} />
          <Input label="Email" defaultValue="user@example.com" type="email" leftIcon={<Mail size={16}/>} />
          <Button variant="primary" size="md">Save Changes</Button>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Bell size={18} className="text-brand-400" />
          <h3 className="text-white font-semibold">Notifications</h3>
        </div>
        {['New job matches','Course recommendations','Research domain updates','Weekly summary'].map(item => (
          <label key={item} className="flex items-center justify-between py-3 border-b border-white/6 last:border-0 cursor-pointer group">
            <span className="text-slate-300 text-sm group-hover:text-white transition-colors">{item}</span>
            <input type="checkbox" defaultChecked className="w-4 h-4 rounded accent-brand-500" />
          </label>
        ))}
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-5">
          <Shield size={18} className="text-brand-400" />
          <h3 className="text-white font-semibold">Security</h3>
        </div>
        <Button variant="outline" size="md">Change Password</Button>
      </Card>
    </div>
  )
}

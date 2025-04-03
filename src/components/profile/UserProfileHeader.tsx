
import { UserProfile } from "@/types/userProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarIcon, Mail, Phone, Building2 } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';

interface UserProfileHeaderProps {
  profile: UserProfile;
}

export const UserProfileHeader = ({ profile }: UserProfileHeaderProps) => {
  const joinedDate = new Date(profile.created_at);
  
  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="shrink-0">
            <Avatar className="h-24 w-24 border-2 border-gray-200">
              <AvatarImage src={profile.avatar_url || ''} alt={profile.full_name || 'User'} />
              <AvatarFallback className="text-3xl">
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold mb-2">{profile.full_name || '未设置名称'}</h1>
            
            {profile.username && <p className="text-gray-500 mb-2">@{profile.username}</p>}
            
            {profile.bio && <p className="mb-3 text-gray-700">{profile.bio}</p>}
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm">
              {profile.contact_email && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{profile.contact_email}</span>
                </div>
              )}
              
              {profile.contact_phone && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Phone className="h-4 w-4" />
                  <span>{profile.contact_phone}</span>
                </div>
              )}
              
              {profile.company_name && (
                <div className="flex items-center gap-1 text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span>{profile.company_name}</span>
                </div>
              )}
              
              <div className="flex items-center gap-1 text-gray-600">
                <CalendarIcon className="h-4 w-4" />
                <span>加入于 {formatDistanceToNow(joinedDate, { addSuffix: true })}</span>
              </div>
            </div>
          </div>
          
          <div className="shrink-0 flex flex-col items-center gap-2">
            {profile.is_seller && (
              <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                卖家
              </div>
            )}
            
            {profile.seller_verified && (
              <div className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                已认证
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

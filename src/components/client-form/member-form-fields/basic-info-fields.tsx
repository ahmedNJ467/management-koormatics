
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MemberFormValues } from "../types";

interface BasicInfoFieldsProps {
  member: MemberFormValues;
  onChange: {
    handleNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRoleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handlePhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }
}

export function BasicInfoFields({ member, onChange }: BasicInfoFieldsProps) {
  const { handleNameChange, handleRoleChange, handleEmailChange, handlePhoneChange } = onChange;
  
  return (
    <>
      <div className="space-y-2">
        <Label>Name *</Label>
        <Input
          value={member.name}
          onChange={handleNameChange}
        />
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Input
          value={member.role || ""}
          onChange={handleRoleChange}
        />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          type="email"
          value={member.email || ""}
          onChange={handleEmailChange}
        />
      </div>
      <div className="space-y-2">
        <Label>Phone</Label>
        <Input
          value={member.phone || ""}
          onChange={handlePhoneChange}
        />
      </div>
    </>
  );
}

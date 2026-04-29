import { router, usePage } from '@inertiajs/react';
import { Ban, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import AdminLayout from '@/layouts/admin/admin-layout';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type User = {
    id: number;
    name: string;
    email: string;
    role: string;
    points: number;
    is_blocked: boolean;
    created_at: string;
};

type PageProps = {
    auth: { user: { id: number } };
};

const roleColor: Record<string, string> = {
    admin: 'bg-red-100 text-red-700',
    teacher: 'bg-blue-100 text-blue-700',
    student: 'bg-green-100 text-green-700',
};

export default function AdminUsers({ users }: { users: User[] }) {
    const { auth } = usePage<PageProps>().props;
    const [editingId, setEditingId] = useState<number | null>(null);

    const changeRole = (userId: number, role: string) => {
        router.patch(`/admin/users/${userId}/role`, { role }, { preserveScroll: true });
        setEditingId(null);
    };

    const toggleBlock = (userId: number) => {
        router.patch(`/admin/users/${userId}/toggle-block`, {}, { preserveScroll: true });
    };

    return (
        <AdminLayout>
            <div className="mb-6">
                <h1 className="text-2xl font-bold">All Users</h1>
                <p className="text-sm text-muted-foreground">{users.length} total users</p>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-8">#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Points</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((user, i) => {
                            const isSelf = user.id === auth.user.id;
                            const isAdmin = user.role === 'admin';
                            return (
                                <TableRow key={user.id} className={user.is_blocked ? 'opacity-60' : ''}>
                                    <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                    <TableCell>
                                        {editingId === user.id ? (
                                            <Select
                                                defaultValue={user.role}
                                                onValueChange={(v) => changeRole(user.id, v)}
                                            >
                                                <SelectTrigger className="h-8 w-32">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="student">student</SelectItem>
                                                    <SelectItem value="teacher">teacher</SelectItem>
                                                    <SelectItem value="admin">admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColor[user.role] ?? 'bg-gray-100 text-gray-700'}`}>
                                                {user.role}
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {user.is_blocked ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                                                <Ban className="h-3 w-3" /> Blocked
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                                                <CheckCircle className="h-3 w-3" /> Active
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">{user.points}</TableCell>
                                    <TableCell className="text-muted-foreground">{user.created_at}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-2">
                                            {editingId === user.id ? (
                                                <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                                                    Cancel
                                                </Button>
                                            ) : (
                                                !isSelf && (
                                                    <Button variant="outline" size="sm" onClick={() => setEditingId(user.id)}>
                                                        Edit Role
                                                    </Button>
                                                )
                                            )}
                                            {!isSelf && !isAdmin && (
                                                <Button
                                                    size="sm"
                                                    variant={user.is_blocked ? 'outline' : 'destructive'}
                                                    className={user.is_blocked ? 'border-emerald-400 text-emerald-700 hover:bg-emerald-50' : ''}
                                                    onClick={() => toggleBlock(user.id)}
                                                >
                                                    {user.is_blocked ? 'Unblock' : 'Block'}
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        {users.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                                    No users found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </AdminLayout>
    );
}

import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TransFn } from './types';

export function ProfileEditor({
    displayName,
    firstLetter,
    currentAvatar,
    profileAvatarPreview,
    profileNameInput,
    profileAboutInput,
    profileSaving,
    profileSaveError,
    trans,
    onNameChange,
    onAboutChange,
    onAvatarFileChange,
    onSave,
    onCancel,
}: {
    displayName: string;
    firstLetter: string;
    currentAvatar: string | null;
    profileAvatarPreview: string | null;
    profileNameInput: string;
    profileAboutInput: string;
    profileSaving: boolean;
    profileSaveError: string | null;
    trans: TransFn;
    onNameChange: (v: string) => void;
    onAboutChange: (v: string) => void;
    onAvatarFileChange: (f: File | null) => void;
    onSave: () => void;
    onCancel: () => void;
}) {
    return (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        {trans('profile.edit_profile')}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">{trans('profile.edit_profile_hint')}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={onCancel} className="rounded-full">
                    <X className="h-3.5 w-3.5" />
                    {trans('profile.cancel')}
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-[auto_1fr]">
                <label className="group relative flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-zinc-50 ring-2 ring-zinc-200 transition hover:ring-zinc-400 dark:bg-zinc-800 dark:ring-zinc-700">
                    {profileAvatarPreview || currentAvatar ? (
                        <img
                            src={profileAvatarPreview ?? currentAvatar ?? undefined}
                            alt={displayName}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span className="text-2xl font-bold text-zinc-500">{firstLetter}</span>
                    )}
                    <span className="absolute inset-0 flex items-center justify-center bg-zinc-900/45 text-white opacity-0 transition group-hover:opacity-100">
                        <Camera className="h-5 w-5" />
                    </span>
                    <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => onAvatarFileChange(e.target.files?.[0] ?? null)}
                    />
                </label>

                <div className="space-y-3">
                    <div>
                        <label htmlFor="profile-name" className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                            {trans('profile.name_label')}
                        </label>
                        <input
                            id="profile-name"
                            value={profileNameInput}
                            onChange={(e) => onNameChange(e.target.value)}
                            className="mt-1 h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm transition outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500 dark:focus:ring-zinc-700/60"
                        />
                    </div>
                    <div>
                        <label htmlFor="profile-about" className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                            {trans('profile.about_label')}
                        </label>
                        <textarea
                            id="profile-about"
                            value={profileAboutInput}
                            maxLength={800}
                            rows={4}
                            onChange={(e) => onAboutChange(e.target.value)}
                            className="mt-1 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 transition outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-500 dark:focus:ring-zinc-700/60"
                        />
                        <p className="mt-1 text-right text-xs text-zinc-400">{profileAboutInput.length}/800</p>
                    </div>

                    {profileSaveError && (
                        <p className="text-xs font-medium text-red-600">{profileSaveError}</p>
                    )}

                    <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={onCancel} className="rounded-full">
                            {trans('profile.cancel')}
                        </Button>
                        <Button
                            size="sm"
                            disabled={profileSaving}
                            onClick={onSave}
                            className="rounded-full border border-zinc-900 bg-zinc-900 text-white transition hover:bg-zinc-700 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                        >
                            {profileSaving ? trans('profile.saving') : trans('profile.save_profile')}
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}

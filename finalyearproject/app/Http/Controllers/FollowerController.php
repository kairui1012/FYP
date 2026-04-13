<?php

namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;


class FollowerController extends Controller
{
    public function toggle(User $user)
    {
        $authUser = Auth::user();
        if ($authUser->following()->where('following_id', $user->id)->exists()) {
            
            $authUser->following()->detach($user->id);
            $status = 'unfollowed';
        } else {
            
            $authUser->following()->attach($user->id);
            $status = 'followed';
        }

        return back()->with('status', $status);
    }
}

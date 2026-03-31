<?php

namespace App\Policies;

use App\Models\Transfer;
use App\Models\User;

class TransferPolicy
{
    /**
     * Determine whether the user can bypass policies.
     */
    public function before(User $user, string $ability): ?bool
    {
        if ($user->role === 'admin') {
            return true; // L'Admin (global) a tous les droits
        }

        return null; // Manager et Employé -> règles spécifiques par site
    }

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Transfer $transfer): bool
    {
        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can validate the transfer.
     */
    public function validate(User $user, Transfer $transfer): bool
    {
        // Only the SOURCE site can validate the transfer request
        if (!$user->site_id || !$transfer->from_site_id) return false;
        return (string)$user->site_id === (string)$transfer->from_site_id;
    }

    /**
     * Determine whether the user can mark as delivered.
     */
    public function deliver(User $user, Transfer $transfer): bool
    {
        // Must be the SOURCE site to deliver
        if (!$user->site_id || !$transfer->from_site_id) return false;
        return (string)$user->site_id === (string)$transfer->from_site_id;
    }

    /**
     * Determine whether the user can mark as received.
     */
    public function receive(User $user, Transfer $transfer): bool
    {
        // Only the DESTINATION site can confirm reception
        if (!$user->site_id || !$transfer->to_site_id) return false;
        return (string)$user->site_id === (string)$transfer->to_site_id;
    }
}

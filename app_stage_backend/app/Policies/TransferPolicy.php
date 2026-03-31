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
        if (in_array($user->role, ['admin', 'manager'])) {
            return true; // L'Admin et le Manager ont tous les droits
        }

        return null; // Employé -> règles spécifiques
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
        // Both SOURCE and DESTINATION can validate the transfer request
        return (int)$user->site_id === (int)$transfer->from_site_id
            || (int)$user->site_id === (int)$transfer->to_site_id;
    }

    /**
     * Determine whether the user can mark as delivered.
     */
    public function deliver(User $user, Transfer $transfer): bool
    {
        return (int)$user->site_id === (int)$transfer->from_site_id;
    }

    /**
     * Determine whether the user can mark as received.
     */
    public function receive(User $user, Transfer $transfer): bool
    {
        return (int)$user->site_id === (int)$transfer->to_site_id;
    }
}

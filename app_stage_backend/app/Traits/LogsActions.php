<?php

namespace App\Traits;

use App\Models\ActionHistory;
use Illuminate\Support\Facades\Auth;

trait LogsActions
{
    protected static function bootLogsActions()
    {
        static::created(function ($model) {
            self::logAction('CREATE', 'Créé un nouvel enregistrement.', $model);
        });

        static::updated(function ($model) {
            self::logAction('UPDATE', 'Mis à jour un enregistrement.', $model);
        });

        static::deleted(function ($model) {
            self::logAction('DELETE', 'Supprimé un enregistrement.', $model);
        });
    }

    protected static function logAction($action, $description, $model)
    {
        if (Auth::check()) {
            $user = Auth::user();
            ActionHistory::create([
                'action_type' => $action,
                'description'   => $description,
                'user_id'       => $user->id,
                'user_name'     => $user->nom . ' ' . $user->prenom,
                'user_role'     => $user->role,
                'site_id'     => $user->site_id,
                'table_name'    => $model->getTable(),
                'record_id'     => $model->id,
                'ip_address'    => request()->ip(),
            ]);
        }
    }
}

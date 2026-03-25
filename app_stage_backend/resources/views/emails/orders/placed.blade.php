<x-mail::message>
# Nouvelle Commande

Bonjour,

Une nouvelle commande a été passée par **LEONI Logistique**.

**Détails de la commande :**
- **Numéro de commande :** {{ $order->order_number }}
- **Produit (Part Number) :** {{ $order->product->part_number }}
- **Quantité :** {{ $order->quantity }}
- **Site de destination :** {{ $order->site->name }}

Merci de confirmer la réception de cette commande.

Merci,<br>
L'équipe Logistique LEONI
</x-mail::message>

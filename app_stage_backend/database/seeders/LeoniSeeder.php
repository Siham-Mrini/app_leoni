<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Site;
use App\Models\Supplier;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class LeoniSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Create Default Sites
        $sites = [
            ['name' => 'LEONI Berrechid', 'location' => 'Berrechid, Maroc'],
            ['name' => 'LEONI Bouskoura', 'location' => 'Bouskoura, Maroc'],
            ['name' => 'LEONI Ain Sebaa', 'location' => 'Casablanca, Maroc'],
        ];

        foreach ($sites as $siteData) {
            Site::firstOrCreate(['name' => $siteData['name']], $siteData);
        }

        // 2. Create Default Suppliers
        $suppliers = [
            ['name' => 'TechSolutions', 'contact_email' => 'contact@techsolutions.com'],
            ['name' => 'DEV MAC', 'contact_email' => 'contact@devmac.com'],
            ['name' => 'Global Equipement', 'contact_email' => 'sales@globalequip.com'],
        ];

        foreach ($suppliers as $supData) {
            Supplier::firstOrCreate(['name' => $supData['name']], $supData);
        }

        $this->command->info('Seeding completed successfully: Sites and Suppliers are ready.');

        $techSup = Supplier::where('name', 'TechSolutions SARL')->first();

        // 3. Create Products
        $products = [
            [
                'part_number' => 'LT-5000-X',
                'sku' => 'PRD-001',
                'type' => 'Tag',
                'family' => 'Scanner',
                'price' => 1200.50,
                'supplier_id' => $techSup ? $techSup->id : null
            ],
            [
                'part_number' => 'ZBR-310',
                'sku' => 'PRD-002',
                'type' => 'Booléen',
                'family' => 'Imprimante',
                'price' => 3500.00,
                'supplier_id' => $techSup ? $techSup->id : null
            ],
        ];

        foreach ($products as $prodData) {
            if ($techSup) {
                Product::firstOrCreate(['part_number' => $prodData['part_number']], $prodData);
            } else {
                \Log::warning("Skipping product seeding for " . $prodData['part_number'] . " because supplier not found.");
            }
        }

        $site = Site::firstOrCreate(['name' => 'LEONI Wiring Systems'], ['location' => 'Bouskoura']);

        // 4. Create Users
        User::updateOrCreate(
            ['email' => 'admin@leoni.com'],
            [
                'nom' => 'Admin',
                'prenom' => 'System',
                'name' => 'admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'site_id' => $site->id,
            ]
        );

        User::updateOrCreate(
            ['email' => 'agent@leoni.com'],
            [
                'nom' => 'Agent',
                'prenom' => 'Local',
                'name' => 'agent',
                'password' => Hash::make('password'),
                'role' => 'employe',
                'site_id' => $site->id,
            ]
        );
    }
}

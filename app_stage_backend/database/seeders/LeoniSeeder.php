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
        // 1. Create Sites
        $sites = [
            ['name' => 'LEONI Wiring Systems', 'location' => 'Bouskoura'],
            ['name' => 'LEONI Berrechid', 'location' => 'Berrechid'],
            ['name' => 'LEONI Ain Sebaa', 'location' => 'Casablanca'],
        ];

        foreach ($sites as $siteData) {
            Site::firstOrCreate(['name' => $siteData['name']], $siteData);
        }

        $bouskoura = Site::where('name', 'LEONI Wiring Systems')->first();

        // 2. Create Suppliers
        $suppliers = [
            ['name' => 'TechSolutions SARL', 'contact_person' => 'Ahmed Alaoui', 'phone' => '0522001122'],
            ['name' => 'Global Equipement', 'contact_person' => 'Maria Santos', 'phone' => '0522334455'],
        ];

        foreach ($suppliers as $supData) {
            Supplier::firstOrCreate(['name' => $supData['name']], $supData);
        }

        $techSup = Supplier::where('name', 'TechSolutions SARL')->first();

        // 3. Create Products
        $products = [
            [
                'part_number' => 'LT-5000-X',
                'sku' => 'PRD-001',
                'type' => 'Tag',
                'family' => 'Scanner',
                'price' => 1200.50,
                'supplier_id' => $techSup->id
            ],
            [
                'part_number' => 'ZBR-310',
                'sku' => 'PRD-002',
                'type' => 'Booléen',
                'family' => 'Imprimante',
                'price' => 3500.00,
                'supplier_id' => $techSup->id
            ],
        ];

        foreach ($products as $prodData) {
            Product::firstOrCreate(['part_number' => $prodData['part_number']], $prodData);
        }

        // 4. Create Users
        User::updateOrCreate(
            ['email' => 'admin@leoni.com'],
            [
                'nom' => 'Admin',
                'prenom' => 'System',
                'name' => 'admin',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'site_id' => $bouskoura->id,
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
                'site_id' => $bouskoura->id,
            ]
        );
    }
}

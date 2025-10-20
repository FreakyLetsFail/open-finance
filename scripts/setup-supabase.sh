#!/bin/bash

# Supabase Setup Script für Open Finance
# Dieses Skript hilft beim initialen Setup des Supabase Projekts

echo "🚀 Open Finance - Supabase Setup"
echo "=================================="
echo ""

# Farben für Output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Prüfe ob supabase CLI installiert ist
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI ist nicht installiert${NC}"
    echo "Installieren Sie es mit: brew install supabase/tap/supabase"
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI gefunden${NC}"
echo ""

# Zeige verfügbare Projekte
echo "📋 Ihre Supabase Projekte:"
supabase projects list
echo ""

# Frage nach Project Ref
echo -e "${YELLOW}Wählen Sie eine Option:${NC}"
echo "1. Neues Projekt erstellen"
echo "2. Bestehendes Projekt verwenden"
read -p "Ihre Wahl (1/2): " choice

if [ "$choice" = "1" ]; then
    # Neues Projekt erstellen
    read -p "Projektname: " project_name
    read -p "Organisation ID: " org_id
    read -p "Region (z.B. eu-central-1): " region

    echo -e "${YELLOW}Erstelle neues Projekt...${NC}"
    supabase projects create "$project_name" --org-id "$org_id" --region "$region"

    # Projekt-Ref aus der Ausgabe extrahieren
    echo ""
    echo -e "${GREEN}✓ Projekt erstellt${NC}"
    supabase projects list

elif [ "$choice" = "2" ]; then
    # Bestehendes Projekt verwenden
    read -p "Project Reference ID: " project_ref

    echo -e "${YELLOW}Verlinke Projekt...${NC}"
    supabase link --project-ref "$project_ref"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Projekt erfolgreich verlinkt${NC}"
    else
        echo -e "${RED}❌ Fehler beim Verlinken${NC}"
        exit 1
    fi
else
    echo -e "${RED}Ungültige Auswahl${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Wende Datenbank-Migration an...${NC}"

# Migration anwenden
if [ -f "database/migrations/001_initial_setup.sql" ]; then
    supabase db push

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Migration erfolgreich angewendet${NC}"
    else
        echo -e "${RED}❌ Fehler bei der Migration${NC}"
        echo "Versuchen Sie manuell: supabase db execute < database/migrations/001_initial_setup.sql"
    fi
else
    echo -e "${YELLOW}⚠ Migration-Datei nicht gefunden${NC}"
    echo "Bitte führen Sie die Migration manuell aus"
fi

echo ""
echo -e "${YELLOW}Füge RLS Policies hinzu...${NC}"

if [ -f "database/policies/rls-policies.sql" ]; then
    supabase db execute < database/policies/rls-policies.sql

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ RLS Policies erfolgreich hinzugefügt${NC}"
    else
        echo -e "${RED}❌ Fehler bei RLS Policies${NC}"
    fi
else
    echo -e "${YELLOW}⚠ RLS Policies-Datei nicht gefunden${NC}"
fi

echo ""
echo -e "${YELLOW}Generiere TypeScript Types...${NC}"
supabase gen types typescript --linked > types/supabase.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ TypeScript Types generiert${NC}"
else
    echo -e "${RED}❌ Fehler beim Generieren der Types${NC}"
fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ Setup abgeschlossen!${NC}"
echo ""
echo "Nächste Schritte:"
echo "1. Kopieren Sie die Environment Variables:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "2. Fügen Sie diese in .env.local ein"
echo ""
echo "3. Starten Sie die Anwendung mit: npm run dev"
echo ""
echo "Dashboard: https://supabase.com/dashboard/project/_"

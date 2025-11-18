"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/app-layout";
import { TagGenerationTab } from "./components/tag-generation-tab";
import { TaxonomyTab } from "./components/taxonomy-tab";
import { ReportsTab } from "./components/reports-tab";
import { AllTagsTab } from "./components/all-tags-tab";

export default function TagsPage() {
  const [activeTab, setActiveTab] = useState("generation");

  return (
    <AppLayout
      title="Taggar"
      description="Hantera taggar, generera nya baserat på föreningsdata och underhåll taxonomi"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 grid w-full max-w-3xl grid-cols-4 bg-white">
          <TabsTrigger value="generation">Generera</TabsTrigger>
          <TabsTrigger value="taxonomy">Taxonomi</TabsTrigger>
          <TabsTrigger value="reports">Rapporter</TabsTrigger>
          <TabsTrigger value="all">Alla taggar</TabsTrigger>
        </TabsList>

        <TabsContent value="generation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Generera nya taggar</CardTitle>
              <CardDescription>
                Extrahera taggar från föreningsdata baserat på typer, aktiviteter eller kategorier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TagGenerationTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="taxonomy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Taxonomi</CardTitle>
              <CardDescription>
                Hantera alias-mappningar för att normalisera stavningsvarianter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TaxonomyTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Körhistorik</CardTitle>
              <CardDescription>
                Visa alla tidigare taggenererings-körningar och ladda ned rapporter
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReportsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alla taggar</CardTitle>
              <CardDescription>
                Sök och filtrera bland alla taggar i systemet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AllTagsTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}

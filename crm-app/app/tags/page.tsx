"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag as TagIcon } from "lucide-react";
import { TagGenerationTab } from "./components/tag-generation-tab";
import { TaxonomyTab } from "./components/taxonomy-tab";
import { ReportsTab } from "./components/reports-tab";
import { AllTagsTab } from "./components/all-tags-tab";

export default function TagsPage() {
  const [activeTab, setActiveTab] = useState("generation");

  return (
    <div className="flex h-screen flex-col">
      <div className="border-b border-slate-200 bg-white px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
            <TagIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Taggar</h1>
            <p className="text-sm text-slate-500">
              Hantera taggar, generera nya baserat på föreningsdata och underhåll taxonomi
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-slate-50 p-8">
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
      </div>
    </div>
  );
}

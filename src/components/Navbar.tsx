'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';

interface NavbarProps {
  selectedWebsite: string;
  onWebsiteChange: (website: string) => void;
  onAddWebsite: (website: string) => void;
  onDeleteWebsite: (website: string) => void;
  websites: string[];
}

export default function Navbar({ selectedWebsite, onWebsiteChange, onAddWebsite, onDeleteWebsite, websites }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newWebsite, setNewWebsite] = useState('');

  const handleAddWebsite = () => {
    if (newWebsite.trim()) {
      onAddWebsite(newWebsite.trim());
      setNewWebsite('');
      setIsOpen(false);
    }
  };

  const handleDeleteWebsite = (website: string) => {
    onDeleteWebsite(website);
    setIsOpen(false);
  };

  return (
    <nav className="border-b bg-background border-border">
      <div className="flex h-14 items-center w-full px-4">
        <div className="mr-4 hidden md:flex">
          <h1 className="text-lg font-semibold px-2 2xl:text-xl 2xl:px-3 text-gray-900 dark:text-gray-100">Product Scraper</h1>
        </div>
        
        <div className="flex flex-1 items-center justify-end">
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-[200px] 2xl:w-[250px] justify-between bg-secondary hover:bg-secondary/80 border-border hover:border-border/80">
                <span className="truncate">{selectedWebsite || 'Select Website'}</span>
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[300px]">
<div className="p-2 2xl:p-3">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter domain..."
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddWebsite()}
                    className="flex-1 2xl:text-base"
                  />
                  <Button size="sm" onClick={handleAddWebsite} className="2xl:px-4">
                    <Plus className="h-4 w-4 2xl:h-5 2xl:w-5" />
                  </Button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
{websites.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No websites added yet</div>
                    ) : (
                      websites.map((website) => (
                        <DropdownMenuItem key={website}>
                          <div className="flex items-center justify-between w-full">
                            <button
                              type="button"
                              onClick={() => {
                                onWebsiteChange(website);
                                setIsOpen(false);
                              }}
                              className={`flex-1 text-left px-2 py-1 hover:bg-accent rounded transition-colors ${
                                selectedWebsite === website ? 'bg-accent' : ''
                              }`}
                            >
                              {website}
                            </button>
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWebsite(website);
                              }}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive/80"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
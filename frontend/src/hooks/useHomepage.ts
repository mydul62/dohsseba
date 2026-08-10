import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { homepageService, HeroSlideData, PromoCardData } from '@/services/homepageService';

export const HOMEPAGE_QUERY_KEY = ['homepage', 'full'];

export function useHomepage(initialData?: any) {
  const queryClient = useQueryClient();

  const homepageQuery = useQuery({
    queryKey: HOMEPAGE_QUERY_KEY,
    queryFn: () => homepageService.getFullHomepageData(),
    initialData,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  const createHeroMutation = useMutation({
    mutationFn: (data: Partial<HeroSlideData>) => homepageService.createHeroSlide(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOMEPAGE_QUERY_KEY });
    },
  });

  const updateHeroMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HeroSlideData> }) =>
      homepageService.updateHeroSlide(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOMEPAGE_QUERY_KEY });
    },
  });

  const deleteHeroMutation = useMutation({
    mutationFn: (id: string) => homepageService.deleteHeroSlide(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOMEPAGE_QUERY_KEY });
    },
  });

  const createPromoMutation = useMutation({
    mutationFn: (data: Partial<PromoCardData>) => homepageService.createPromoCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOMEPAGE_QUERY_KEY });
    },
  });

  const updatePromoMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<PromoCardData> }) =>
      homepageService.updatePromoCard(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOMEPAGE_QUERY_KEY });
    },
  });

  const deletePromoMutation = useMutation({
    mutationFn: (id: string) => homepageService.deletePromoCard(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOMEPAGE_QUERY_KEY });
    },
  });

  const createShortcutMutation = useMutation({
    mutationFn: (data: any) => homepageService.createShortcut(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOMEPAGE_QUERY_KEY });
    },
  });

  const updateShortcutMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => homepageService.updateShortcut(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOMEPAGE_QUERY_KEY });
    },
  });

  const deleteShortcutMutation = useMutation({
    mutationFn: (id: string) => homepageService.deleteShortcut(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOMEPAGE_QUERY_KEY });
    },
  });

  const createLocationMutation = useMutation({
    mutationFn: (data: any) => homepageService.createLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOMEPAGE_QUERY_KEY });
    },
  });

  const updateLocationMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => homepageService.updateLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOMEPAGE_QUERY_KEY });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: (id: string) => homepageService.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HOMEPAGE_QUERY_KEY });
    },
  });

  return {
    ...homepageQuery,
    heroSlides: homepageQuery.data?.heroSlides || [],
    promoCards: homepageQuery.data?.promoCards || [],
    featuredShortcuts: homepageQuery.data?.featuredShortcuts || [],
    locations: homepageQuery.data?.locations || [],
    createHero: createHeroMutation.mutateAsync,
    updateHero: updateHeroMutation.mutateAsync,
    deleteHero: deleteHeroMutation.mutateAsync,
    createPromo: createPromoMutation.mutateAsync,
    updatePromo: updatePromoMutation.mutateAsync,
    deletePromo: deletePromoMutation.mutateAsync,
    createShortcut: createShortcutMutation.mutateAsync,
    updateShortcut: updateShortcutMutation.mutateAsync,
    deleteShortcut: deleteShortcutMutation.mutateAsync,
    createLocation: createLocationMutation.mutateAsync,
    updateLocation: updateLocationMutation.mutateAsync,
    deleteLocation: deleteLocationMutation.mutateAsync,
  };
}

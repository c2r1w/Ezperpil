'use client';

import * as React from 'react';
import { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Copy, ExternalLink, Plus, Save, Trash2, X, Pencil, Settings, Video, Radio, CalendarIcon, AlertCircle, Share2, Ticket } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { auth, db } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { WebinarLandingPage, Testimonial } from '@/components/webinar/webinar-landing-page';
import { FileUploadDialog } from '@/components/ui/FileUploadDialog';
import Rh from '@/lib/rh';
import { log } from 'console';




// Mock data to differentiate templates
const MOCK_TEMPLATE_DATA = {
    'video-template-1': { type: 'video' as const },
    'text-template-1': { type: 'text' as const },
};


function WebinarEditor() {
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const templateId = searchParams?.get('id');
    const templateType = MOCK_TEMPLATE_DATA[templateId as keyof typeof MOCK_TEMPLATE_DATA]?.type || 'text';

    const [user] = useAuthState(auth);
    const [currentUserData, setCurrentUserData] = React.useState<{ username?: string } | null>(null);
    const [loadingUserData, setLoadingUserData] = React.useState(true);
    
    // State for header content and styling
    const [headerHeadline, setHeaderHeadline] = useState('Amazing way to connect with people');
    const [headerSubheadline, setHeaderSubheadline] = useState('Transform Your Online Presence in 60 Minutes');
    const [headerHeadlineSize, setHeaderHeadlineSize] = useState(48);
    const [headerHeadlineColor, setHeaderHeadlineColor] = useState('#FFFFFF');
    const [isHeaderHeadlineBold, setIsHeaderHeadlineBold] = useState(true);
    const [headerSubheadlineSize, setHeaderSubheadlineSize] = useState(20);
    const [headerSubheadlineColor, setHeaderSubheadlineColor] = useState('#FFFFFF');
    const [isHeaderSubheadlineBold, setIsHeaderSubheadlineBold] = useState(false);
    
    // State for header background
    const [headerBackgroundType, setHeaderBackgroundType] = useState<'gradient' | 'color' | 'image'>('gradient');
    const [headerGradientStart, setHeaderGradientStart] = useState('#3B82F6');
    const [headerGradientEnd, setHeaderGradientEnd] = useState('#0EA5E9');
    const [headerSolidColor, setHeaderSolidColor] = useState('#3B82F6');
    const [headerImageFile, setHeaderImageFile] = useState<File | null>(null);
    const [headerImagePreview, setHeaderImagePreview] = useState<string>('');
    const [headerOverlayColor, setHeaderOverlayColor] = useState('#000000');
    const [headerOverlayOpacity, setHeaderOverlayOpacity] = useState(0.5);

    // State for styling
    const [titleSize, setTitleSize] = useState(30);
    const [titleColor, setTitleColor] = useState('#0F172A');
    const [isTitleBold, setIsTitleBold] = useState(true);
    
    // State for section titles
    const [learnSectionTitle, setLearnSectionTitle] = useState("What You'll Learn:");
const [presenterSectionTitle, setPresenterSectionTitle] = useState("Your Presenter");
    const [includedSectionTitle, setIncludedSectionTitle] = useState("What's Included:");
    const [considerationSectionTitle, setConsiderationSectionTitle] = useState("Porque deberías considerar esto");
    const [testimonialsSectionTitle, setTestimonialsSectionTitle] = useState("Testimonios que Inspiran");
    const [opportunitySectionTitle, setOpportunitySectionTitle] = useState("Don't Miss This Opportunity!");
    const [accessSectionTitle, setAccessSectionTitle] = useState("¿Ya tienes acceso?");

    // State for opportunity section description
    const [opportunitySectionDescription, setOpportunitySectionDescription] = useState("Join thousands of professionals transforming their business");
    const [opportunitySectionDescriptionSize, setOpportunitySectionDescriptionSize] = useState(18);
    const [opportunitySectionDescriptionColor, setOpportunitySectionDescriptionColor] = useState('#64748B');
    const [isOpportunitySectionDescriptionBold, setIsOpportunitySectionDescriptionBold] = useState(false);

    // State for access section description
    const [accessSectionDescription, setAccessSectionDescription] = useState("Ingresa tu código para ver el contenido exclusivo.");
    const [accessSectionDescriptionSize, setAccessSectionDescriptionSize] = useState(18);
    const [accessSectionDescriptionColor, setAccessSectionDescriptionColor] = useState('#64748B');
    const [isAccessSectionDescriptionBold, setIsAccessSectionDescriptionBold] = useState(false);

    const [webinarDateTime, setWebinarDateTime] = useState<Date>(new Date());
    
    useEffect(() => {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        d.setHours(19, 0, 0, 0);
        setWebinarDateTime(d);
    }, []);

    const [countdownSize, setCountdownSize] = useState(29);
    const [countdownColor, setCountdownColor] = useState('#0F172A');
    const [isCountdownBold, setIsCountdownBold] = useState(false);

    // State for video content
    const [videoSourceType, setVideoSourceType] = React.useState<'url' | 'upload'>('url');
    const [videoUrl, setVideoUrl] = React.useState('https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4');
    const [videoFile, setVideoFile] = React.useState<File | null>(null);
    const [previewVideoUrl, setPreviewVideoUrl] = React.useState(videoUrl);

    // State for learning points (text template)
    const [learningPoints, setLearningPoints] = useState([
        "Build Professional Digital Profiles",
        "Increase Online Visibility by 300%",
        "Master Social Media Integration",
        "Learn Advanced SEO Techniques",
    ]);

    // State for "What's Included" section
    const [includedPoints, setIncludedPoints] = React.useState([
        "Build Professional Digital Profiles",
        "Increase Online Visibility by 300%",
        "Master Social Media Integration",
        "Learn Advanced SEO Techniques",
    ]);
    const [includedItemSize, setIncludedItemSize] = React.useState(16);
    const [includedItemColor, setIncludedItemColor] = React.useState('#475569');
    const [isIncludedItemBold, setIsIncludedItemBold] = React.useState(false);

    // State for Case Study section
    const [caseStudyHeadline, setCaseStudyHeadline] = useState('How a Local Business Doubled Their Sales');
    const [caseStudyDescription, setCaseStudyDescription] = useState('Discover the step-by-step strategy that transformed their online presence and skyrocketed their revenue in just 90 days.');
    const [caseStudyImageUrl, setCaseStudyImageUrl] = useState('https://placehold.co/500x300.png');
    const [caseStudyImageFile, setCaseStudyImageFile] = useState<File | null>(null);
    const [caseStudyHeadlineSize, setCaseStudyHeadlineSize] = useState(24);
    const [caseStudyHeadlineColor, setCaseStudyHeadlineColor] = useState('#1E293B');
    const [isCaseStudyHeadlineBold, setIsCaseStudyHeadlineBold] = useState(true);
    const [caseStudyDescriptionSize, setCaseStudyDescriptionSize] = useState(16);
    const [caseStudyDescriptionColor, setCaseStudyDescriptionColor] = useState('#475569');
    const [isCaseStudyDescriptionBold, setIsCaseStudyDescriptionBold] = useState(false);


    // State for new consideration section
    const [considerationPoints, setConsiderationPoints] = useState([
        "Acceso a una comunidad exclusiva.",
        "Soporte prioritario 24/7.",
        "Contenido descargable y recursos adicionales.",
    ]);
    const [considerationItemSize, setConsiderationItemSize] = React.useState(16);
    const [considerationItemColor, setConsiderationItemColor] = React.useState('#475569');
    const [isConsiderationItemBold, setIsConsiderationItemBold] = React.useState(false);
    
    // State for presenter
    const [presenterName, setPresenterName] = useState('Eddie Partida');
    const [presenterDescription, setPresenterDescription] = useState('Digital Marketing Expert & EZ Perfil Founder');
    const [presenterNameSize, setPresenterNameSize] = useState(18);
    const [presenterNameColor, setPresenterNameColor] = useState('#1E293B');
    const [isPresenterNameBold, setIsPresenterNameBold] = useState(true);
    const [presenterDescriptionSize, setPresenterDescriptionSize] = useState(14);
    const [presenterDescriptionColor, setPresenterDescriptionColor] = useState('#475569');
    const [isPresenterDescriptionBold, setIsPresenterDescriptionBold] = useState(false);
    const [presenterAvatar, setPresenterAvatar] = useState('');
    const [presenterAvatarFile, setPresenterAvatarFile] = useState<File | null>(null);

    // State for testimonials
    const [testimonials, setTestimonials] = useState<Testimonial[]>([
        { id: 1, name: 'Ana López', problem: 'Luchaba por conseguir clientes potenciales.', solution: 'Ahora mis webinars generan un flujo constante de leads cualificados.', personAvatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent('Ana López')}`, personAvatarFile: null, beforeImageUrl: 'https://placehold.co/300x200.png', beforeImageFile: null, afterImageUrl: 'https://placehold.co/300x200.png', afterImageFile: null },
        { id: 2, name: 'Carlos García', problem: 'Mi alcance era muy limitado y local.', solution: 'He llegado a clientes en tres continentes diferentes.', personAvatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent('Carlos García')}`, personAvatarFile: null, beforeImageUrl: 'https://placehold.co/300x200.png', beforeImageFile: null, afterImageUrl: 'https://placehold.co/300x200.png', afterImageFile: null },
        { id: 3, name: 'Sofía Martínez', problem: 'No lograba posicionarme como experta.', solution: 'Soy una referente en mi nicho gracias a los webinars.', personAvatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent('Sofía Martínez')}`, personAvatarFile: null, beforeImageUrl: 'https://placehold.co/300x200.png', beforeImageFile: null, afterImageUrl: 'https://placehold.co/300x200.png', afterImageFile: null },
        { id: 4, name: 'Javier Rodríguez', problem: 'Mis ventas estaban estancadas.', solution: 'Mis ingresos aumentaron un 40% en solo un trimestre.', personAvatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent('Javier Rodríguez')}`, personAvatarFile: null, beforeImageUrl: 'https://placehold.co/300x200.png', beforeImageFile: null, afterImageUrl: 'https://placehold.co/300x200.png', afterImageFile: null },
    ]);
    const [testimonialNameSize, setTestimonialNameSize] = useState(16);
    const [testimonialNameColor, setTestimonialNameColor] = useState('#1E293B');
    const [isTestimonialNameBold, setIsTestimonialNameBold] = useState(true);
    const [testimonialDescriptionSize, setTestimonialDescriptionSize] = useState(12);
    const [testimonialDescriptionColor, setTestimonialDescriptionColor] = useState('#475569');
    const [isTestimonialDescriptionBold, setIsTestimonialDescriptionBold] = useState(false);
    const [testimonialBeforeLabelColor, setTestimonialBeforeLabelColor] = useState('#334155');
    const [testimonialAfterLabelColor, setTestimonialAfterLabelColor] = useState('#2563EB');
    const [testimonialSectionDescription, setTestimonialSectionDescription] = useState('Haz clic en una tarjeta para ver los detalles');
    const [testimonialSectionDescriptionSize, setTestimonialSectionDescriptionSize] = useState(14);
    const [testimonialSectionDescriptionColor, setTestimonialSectionDescriptionColor] = useState('#64748B');
    const [isTestimonialSectionDescriptionBold, setIsTestimonialSectionDescriptionBold] = useState(false);

    // State for webinar access
    const [replayUrl, setReplayUrl] = useState('https://replay.example.com');
    const [replayCode, setReplayCode] = useState('REPLAY123');
    const [replayVideoSourceType, setReplayVideoSourceType] = React.useState<'url' | 'upload'>('url');
    const [replayVideoFile, setReplayVideoFile] = React.useState<string>('');
    const [liveUrl, setLiveUrl] = useState('https://live.example.com');
    const [liveCode, setLiveCode] = useState('LIVE123');

    // New state for content syncing
    const [partnerCode, setPartnerCode] = useState('');
    const [isPartnerCode, setIsPartnerCode] = useState(false);
    const [adminCode, setAdminCode] = useState('');
    const [isAdminCode, setIsAdminCode] = useState(false);

    // State for sharing
    const [canShare, setCanShare] = useState(false);

    // State for payment section
    const [isPaymentEnabled, setIsPaymentEnabled] = React.useState(false);
    const [paymentLink, setPaymentLink] = React.useState('https://stripe.com');
    const [paymentButtonText, setPaymentButtonText] = React.useState('Pay for your Ticket');
    const [paymentSectionTitle, setPaymentSectionTitle] = React.useState('Get Your Ticket Now');

    useEffect(() => {
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
            setCanShare(true);
        }
        
    }, []);


  const [webinarData, setWebinarData] = useState<any>({});

  // Set default values from webinarData if keys exist
  useEffect(() => {
    if (!webinarData || Object.keys(webinarData).length === 0) return;
    if (webinarData.headerHeadline) setHeaderHeadline(webinarData.headerHeadline);
    if (webinarData.headerSubheadline) setHeaderSubheadline(webinarData.headerSubheadline);
    if (webinarData.headerHeadlineSize) setHeaderHeadlineSize(webinarData.headerHeadlineSize);
    if (webinarData.headerHeadlineColor) setHeaderHeadlineColor(webinarData.headerHeadlineColor);
    if (typeof webinarData.isHeaderHeadlineBold === 'boolean') setIsHeaderHeadlineBold(webinarData.isHeaderHeadlineBold);
    if (webinarData.headerSubheadlineSize) setHeaderSubheadlineSize(webinarData.headerSubheadlineSize);
    if (webinarData.headerSubheadlineColor) setHeaderSubheadlineColor(webinarData.headerSubheadlineColor);
    if (typeof webinarData.isHeaderSubheadlineBold === 'boolean') setIsHeaderSubheadlineBold(webinarData.isHeaderSubheadlineBold);
    if (webinarData.headerBackgroundType) setHeaderBackgroundType(webinarData.headerBackgroundType);
    if (webinarData.headerGradientStart) setHeaderGradientStart(webinarData.headerGradientStart);
    if (webinarData.headerGradientEnd) setHeaderGradientEnd(webinarData.headerGradientEnd);
    if (webinarData.headerSolidColor) setHeaderSolidColor(webinarData.headerSolidColor);
    if (webinarData.headerImagePreview) setHeaderImagePreview(webinarData.headerImagePreview);
    if (webinarData.headerOverlayColor) setHeaderOverlayColor(webinarData.headerOverlayColor);
    if (typeof webinarData.headerOverlayOpacity === 'number') setHeaderOverlayOpacity(webinarData.headerOverlayOpacity);
    if (webinarData.titleSize) setTitleSize(webinarData.titleSize);
    if (webinarData.titleColor) setTitleColor(webinarData.titleColor);
    if (typeof webinarData.isTitleBold === 'boolean') setIsTitleBold(webinarData.isTitleBold);
    if (webinarData.learnSectionTitle) setLearnSectionTitle(webinarData.learnSectionTitle);
    if (webinarData.presenterSectionTitle) setPresenterSectionTitle(webinarData.presenterSectionTitle);
    if (webinarData.includedSectionTitle) setIncludedSectionTitle(webinarData.includedSectionTitle);
    if (webinarData.considerationSectionTitle) setConsiderationSectionTitle(webinarData.considerationSectionTitle);
    if (webinarData.testimonialsSectionTitle) setTestimonialsSectionTitle(webinarData.testimonialsSectionTitle);
    if (webinarData.opportunitySectionTitle) setOpportunitySectionTitle(webinarData.opportunitySectionTitle);
    if (webinarData.accessSectionTitle) setAccessSectionTitle(webinarData.accessSectionTitle);
    if (webinarData.opportunitySectionDescription) setOpportunitySectionDescription(webinarData.opportunitySectionDescription);
    if (webinarData.opportunitySectionDescriptionSize) setOpportunitySectionDescriptionSize(webinarData.opportunitySectionDescriptionSize);
    if (webinarData.opportunitySectionDescriptionColor) setOpportunitySectionDescriptionColor(webinarData.opportunitySectionDescriptionColor);
    if (typeof webinarData.isOpportunitySectionDescriptionBold === 'boolean') setIsOpportunitySectionDescriptionBold(webinarData.isOpportunitySectionDescriptionBold);
    if (webinarData.accessSectionDescription) setAccessSectionDescription(webinarData.accessSectionDescription);
    if (webinarData.accessSectionDescriptionSize) setAccessSectionDescriptionSize(webinarData.accessSectionDescriptionSize);
    if (webinarData.accessSectionDescriptionColor) setAccessSectionDescriptionColor(webinarData.accessSectionDescriptionColor);
    if (typeof webinarData.isAccessSectionDescriptionBold === 'boolean') setIsAccessSectionDescriptionBold(webinarData.isAccessSectionDescriptionBold);
    if (webinarData.webinarDateTime) setWebinarDateTime(new Date(webinarData.webinarDateTime));
    if (webinarData.countdownSize) setCountdownSize(webinarData.countdownSize);
    if (webinarData.countdownColor) setCountdownColor(webinarData.countdownColor);
    if (typeof webinarData.isCountdownBold === 'boolean') setIsCountdownBold(webinarData.isCountdownBold);
    if (webinarData.videoSourceType) setVideoSourceType(webinarData.videoSourceType);
    if (webinarData.videoUrl) setVideoUrl(webinarData.videoUrl);
    if (webinarData.previewVideoUrl) setPreviewVideoUrl(webinarData.previewVideoUrl);
    if (Array.isArray(webinarData.learningPoints)) setLearningPoints(webinarData.learningPoints);
    if (Array.isArray(webinarData.includedPoints)) setIncludedPoints(webinarData.includedPoints);
    if (webinarData.includedItemSize) setIncludedItemSize(webinarData.includedItemSize);
    if (webinarData.includedItemColor) setIncludedItemColor(webinarData.includedItemColor);
    if (typeof webinarData.isIncludedItemBold === 'boolean') setIsIncludedItemBold(webinarData.isIncludedItemBold);
    if (webinarData.caseStudyHeadline) setCaseStudyHeadline(webinarData.caseStudyHeadline);
    if (webinarData.caseStudyDescription) setCaseStudyDescription(webinarData.caseStudyDescription);
    if (webinarData.caseStudyImageUrl) setCaseStudyImageUrl(webinarData.caseStudyImageUrl);
    if (webinarData.caseStudyHeadlineSize) setCaseStudyHeadlineSize(webinarData.caseStudyHeadlineSize);
    if (webinarData.caseStudyHeadlineColor) setCaseStudyHeadlineColor(webinarData.caseStudyHeadlineColor);
    if (typeof webinarData.isCaseStudyHeadlineBold === 'boolean') setIsCaseStudyHeadlineBold(webinarData.isCaseStudyHeadlineBold);
    if (webinarData.caseStudyDescriptionSize) setCaseStudyDescriptionSize(webinarData.caseStudyDescriptionSize);
    if (webinarData.caseStudyDescriptionColor) setCaseStudyDescriptionColor(webinarData.caseStudyDescriptionColor);
    if (typeof webinarData.isCaseStudyDescriptionBold === 'boolean') setIsCaseStudyDescriptionBold(webinarData.isCaseStudyDescriptionBold);
    if (Array.isArray(webinarData.considerationPoints)) setConsiderationPoints(webinarData.considerationPoints);
    if (webinarData.considerationItemSize) setConsiderationItemSize(webinarData.considerationItemSize);
    if (webinarData.considerationItemColor) setConsiderationItemColor(webinarData.considerationItemColor);
    if (typeof webinarData.isConsiderationItemBold === 'boolean') setIsConsiderationItemBold(webinarData.isConsiderationItemBold);
    if (webinarData.presenterName) setPresenterName(webinarData.presenterName);
    if (webinarData.presenterDescription) setPresenterDescription(webinarData.presenterDescription);
    if (webinarData.presenterNameSize) setPresenterNameSize(webinarData.presenterNameSize);
    if (webinarData.presenterNameColor) setPresenterNameColor(webinarData.presenterNameColor);
    if (typeof webinarData.isPresenterNameBold === 'boolean') setIsPresenterNameBold(webinarData.isPresenterNameBold);
    if (webinarData.presenterDescriptionSize) setPresenterDescriptionSize(webinarData.presenterDescriptionSize);
    if (webinarData.presenterDescriptionColor) setPresenterDescriptionColor(webinarData.presenterDescriptionColor);
    if (typeof webinarData.isPresenterDescriptionBold === 'boolean') setIsPresenterDescriptionBold(webinarData.isPresenterDescriptionBold);
    if (webinarData.presenterAvatar) setPresenterAvatar(webinarData.presenterAvatar);
    if (Array.isArray(webinarData.testimonials)) setTestimonials(webinarData.testimonials);
    if (webinarData.testimonialNameSize) setTestimonialNameSize(webinarData.testimonialNameSize);
    if (webinarData.testimonialNameColor) setTestimonialNameColor(webinarData.testimonialNameColor);
    if (typeof webinarData.isTestimonialNameBold === 'boolean') setIsTestimonialNameBold(webinarData.isTestimonialNameBold);
    if (webinarData.testimonialDescriptionSize) setTestimonialDescriptionSize(webinarData.testimonialDescriptionSize);
    if (webinarData.testimonialDescriptionColor) setTestimonialDescriptionColor(webinarData.testimonialDescriptionColor);
    if (typeof webinarData.isTestimonialDescriptionBold === 'boolean') setIsTestimonialDescriptionBold(webinarData.isTestimonialDescriptionBold);
    if (webinarData.testimonialBeforeLabelColor) setTestimonialBeforeLabelColor(webinarData.testimonialBeforeLabelColor);
    if (webinarData.testimonialAfterLabelColor) setTestimonialAfterLabelColor(webinarData.testimonialAfterLabelColor);
    if (webinarData.testimonialSectionDescription) setTestimonialSectionDescription(webinarData.testimonialSectionDescription);
    if (webinarData.testimonialSectionDescriptionSize) setTestimonialSectionDescriptionSize(webinarData.testimonialSectionDescriptionSize);
    if (webinarData.testimonialSectionDescriptionColor) setTestimonialSectionDescriptionColor(webinarData.testimonialSectionDescriptionColor);
    if (typeof webinarData.isTestimonialSectionDescriptionBold === 'boolean') setIsTestimonialSectionDescriptionBold(webinarData.isTestimonialSectionDescriptionBold);
    if (webinarData.replayUrl) setReplayUrl(webinarData.replayUrl);
    if (webinarData.replayCode) setReplayCode(webinarData.replayCode);
    if (webinarData.replayVideoSourceType) setReplayVideoSourceType(webinarData.replayVideoSourceType);
    if (webinarData.replayVideoFile) setReplayVideoFile(webinarData.replayVideoFile);
    if (webinarData.liveUrl) setLiveUrl(webinarData.liveUrl);
    if (webinarData.liveCode) setLiveCode(webinarData.liveCode);
    if (webinarData.partnerCode) setPartnerCode(webinarData.partnerCode);
    if (typeof webinarData.isPartnerCode === 'boolean') setIsPartnerCode(webinarData.isPartnerCode);
    if (webinarData.adminCode) setAdminCode(webinarData.adminCode);
    if (typeof webinarData.isAdminCode === 'boolean') setIsAdminCode(webinarData.isAdminCode);
    if (typeof webinarData.isPaymentEnabled === 'boolean') setIsPaymentEnabled(webinarData.isPaymentEnabled);
    if (webinarData.paymentLink) setPaymentLink(webinarData.paymentLink);
    if (webinarData.paymentButtonText) setPaymentButtonText(webinarData.paymentButtonText);
    if (webinarData.paymentSectionTitle) setPaymentSectionTitle(webinarData.paymentSectionTitle);
  }, [webinarData]);

  
      
    const getWebinarData = async () => {
      const userid = `${currentUserData?.username}/${templateId}`;
      try {
        const res = await fetch(`/api/webinar-template?userid=${encodeURIComponent(userid)}`);
        if (!res.ok) return setWebinarData(null);
        const result = await res.json();
        if (result && result.data) {
          setWebinarData(JSON.parse(result.data));
        } else {
          setWebinarData(null);
        }
      } catch {
        setWebinarData({});
      } finally {
      
      }
    };


    React.useEffect(() => {

       
        const fetchWebinarData = async () => {
            if (currentUserData?.username && (!webinarData || Object.keys(webinarData).length === 0)) {
            await getWebinarData();

            setTimeout(() => {
                console.log(webinarData);
            }, 1000);
            }
        };
        if (currentUserData?.username && (!webinarData || Object.keys(webinarData).length === 0)) {
            fetchWebinarData();
        }

        console.log('Current User Data:', currentUserData);
    }, [currentUserData]);







    React.useEffect(() => {
        const fetchCurrentUserData = async () => {
            if (user) {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        setCurrentUserData(userDoc.data() as { username?: string });
                    }
                } catch (error) {
                    console.error("Error fetching current user's data:", error);
                    toast({
                        variant: "destructive",
                        title: "Error",
                        description: "Could not load your user data for link generation.",
                    });
                } finally {
                    setLoadingUserData(false);
                }
            } else {
                 setLoadingUserData(false);
            }
        };
        fetchCurrentUserData();
    }, [user, toast]);


    useEffect(() => {
        const newAvatarUrl = presenterAvatarFile
            ? URL.createObjectURL(presenterAvatarFile)
            : `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(presenterName)}`;

        if (presenterAvatar.startsWith('blob:')) {
            URL.revokeObjectURL(presenterAvatar);
        }
        setPresenterAvatar(newAvatarUrl);

    }, [presenterName, presenterAvatarFile]);


    React.useEffect(() => {
        if (videoSourceType === 'url' || videoSourceType === 'upload') {
            setPreviewVideoUrl(videoUrl);
        } else {
            setPreviewVideoUrl('');
        }
    }, [videoSourceType, videoFile, videoUrl]);
    
    // Effect for cleaning up all created blob URLs on unmount
    useEffect(() => {
        const blobUrls: string[] = [];
        if (headerImagePreview) blobUrls.push(headerImagePreview);
        if (presenterAvatar.startsWith('blob:')) blobUrls.push(presenterAvatar);
        if (caseStudyImageUrl.startsWith('blob:')) blobUrls.push(caseStudyImageUrl);
        testimonials.forEach(t => {
            if (t.personAvatarUrl.startsWith('blob:')) blobUrls.push(t.personAvatarUrl);
            if (t.beforeImageUrl.startsWith('blob:')) blobUrls.push(t.beforeImageUrl);
            if (t.afterImageUrl.startsWith('blob:')) blobUrls.push(t.afterImageUrl);
        });

        return () => {
            blobUrls.forEach(url => {
                if(url) URL.revokeObjectURL(url);
            });
        };
    }, [headerImagePreview, presenterAvatar, caseStudyImageUrl, testimonials]);
    
    const handleHeaderImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({
                    variant: "destructive",
                    title: "Archivo demasiado grande",
                    description: "La imagen no puede superar los 5MB.",
                });
                return;
            }
            setHeaderImageFile(file);
            if (headerImagePreview) {
                URL.revokeObjectURL(headerImagePreview);
            }
            setHeaderImagePreview(URL.createObjectURL(file));
        }
    };

    const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 100 * 1024 * 1024) { // 100MB limit
                toast({
                    variant: "destructive",
                    title: "Archivo demasiado grande",
                    description: "El video no puede superar los 100MB.",
                });
                return;
            }
            setVideoFile(file);
        }
    };
    
    const handleReplayVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 100 * 1024 * 1024) { // 100MB limit
                toast({
                    variant: "destructive",
                    title: "Archivo demasiado grande",
                    description: "El video no puede superar los 100MB.",
                });
                return;
            }
            // Instead of storing the File, store a blob URL string
            setReplayVideoFile(URL.createObjectURL(file));
        }
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({
                    variant: "destructive",
                    title: "Archivo demasiado grande",
                    description: "La imagen no puede superar los 2MB.",
                });
                return;
            }
            setPresenterAvatarFile(file);
        }
    };

    const handleCaseStudyImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                toast({
                    variant: "destructive",
                    title: "Archivo demasiado grande",
                    description: "La imagen no puede superar los 2MB.",
                });
                return;
            }
            setCaseStudyImageFile(file);
            if (caseStudyImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(caseStudyImageUrl);
            }
            setCaseStudyImageUrl(URL.createObjectURL(file));
        }
    };

    const handleAddConsiderationPoint = () => {
        setConsiderationPoints([...considerationPoints, "Nuevo punto"]);
    };

    const handleRemoveConsiderationPoint = (index: number) => {
        const newPoints = considerationPoints.filter((_, i) => i !== index);
        setConsiderationPoints(newPoints);
    };

    const handleConsiderationPointChange = (index: number, value: string) => {
        const newPoints = [...considerationPoints];
        newPoints[index] = value;
        setConsiderationPoints(newPoints);
    };

    const handleAddLearningPoint = () => {
        setLearningPoints([...learningPoints, "Nuevo punto de aprendizaje"]);
    };

    const handleRemoveLearningPoint = (index: number) => {
        const newPoints = learningPoints.filter((_, i) => i !== index);
        setLearningPoints(newPoints);
    };

    const handleLearningPointChange = (index: number, value: string) => {
        const newPoints = [...learningPoints];
        newPoints[index] = value;
        setLearningPoints(newPoints);
    };

    const handleAddIncludedPoint = () => {
        setIncludedPoints([...includedPoints, "Nuevo punto incluido"]);
    };

    const handleRemoveIncludedPoint = (index: number) => {
        const newPoints = includedPoints.filter((_, i) => i !== index);
        setIncludedPoints(newPoints);
    };

    const handleIncludedPointChange = (index: number, value: string) => {
        const newPoints = [...includedPoints];
        newPoints[index] = value;
        setIncludedPoints(newPoints);
    };
    
    const handleTestimonialChange = (index: number, field: 'name' | 'problem' | 'solution', value: string) => {
        const newTestimonials = [...testimonials];
        newTestimonials[index][field] = value;
        if (field === 'name' && !newTestimonials[index].personAvatarFile) {
            newTestimonials[index].personAvatarUrl = `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(value)}`;
        }
        setTestimonials(newTestimonials);
    };

    const handleTestimonialImageChange = (e: string, index: number, type: 'person' | 'before' | 'after') => {
 
  
        if (!e) return;



            const newTestimonials = [...testimonials];
            const fileUrl = Rh.ImgUrl+ e;

            if (type === 'person') {
                newTestimonials[index].personAvatarUrl = fileUrl;
            } else if (type === 'before') {

                newTestimonials[index].beforeImageUrl = fileUrl;
            } else if (type === 'after') {

                newTestimonials[index].afterImageUrl = fileUrl;
            }


            setTestimonials(newTestimonials);
       
    };

    const handleSave = () => {

        // Collect all user-modifiable variables into a JSON object
        const data = {
            templateType,
            headerHeadline,
            headerSubheadline,
            headerHeadlineSize,
            headerHeadlineColor,
            isHeaderHeadlineBold,
            headerSubheadlineSize,
            headerSubheadlineColor,
            isHeaderSubheadlineBold,
            headerBackgroundType,
            headerGradientStart,
            headerGradientEnd,
            headerSolidColor,
            headerImagePreview,
            headerOverlayColor,
            headerOverlayOpacity,
            titleSize,
            titleColor,
            isTitleBold,
            learnSectionTitle,
            presenterSectionTitle,
            includedSectionTitle,
            considerationSectionTitle,
            testimonialsSectionTitle,
            opportunitySectionTitle,
            accessSectionTitle,
            opportunitySectionDescription,
            opportunitySectionDescriptionSize,
            opportunitySectionDescriptionColor,
            isOpportunitySectionDescriptionBold,
            accessSectionDescription,
            accessSectionDescriptionSize,
            accessSectionDescriptionColor,
            isAccessSectionDescriptionBold,
            webinarDateTime,
            countdownSize,
            countdownColor,
            isCountdownBold,
            videoSourceType,
            videoUrl,
            videoFile,
            previewVideoUrl,
            learningPoints,
            includedPoints,
            includedItemSize,
            includedItemColor,
            isIncludedItemBold,
            caseStudyHeadline,
            caseStudyDescription,
            caseStudyImageUrl,
            caseStudyImageFile,
            caseStudyHeadlineSize,
            caseStudyHeadlineColor,
            isCaseStudyHeadlineBold,
            caseStudyDescriptionSize,
            caseStudyDescriptionColor,
            isCaseStudyDescriptionBold,
            considerationPoints,
            considerationItemSize,
            considerationItemColor,
            isConsiderationItemBold,
            presenterName,
            presenterDescription,
            presenterNameSize,
            presenterNameColor,
            isPresenterNameBold,
            presenterDescriptionSize,
            presenterDescriptionColor,
            isPresenterDescriptionBold,
            presenterAvatar,
            presenterAvatarFile,
            testimonials,
            testimonialNameSize,
            testimonialNameColor,
            isTestimonialNameBold,
            testimonialDescriptionSize,
            testimonialDescriptionColor,
            isTestimonialDescriptionBold,
            testimonialBeforeLabelColor,
            testimonialAfterLabelColor,
            testimonialSectionDescription,
            testimonialSectionDescriptionSize,
            testimonialSectionDescriptionColor,
            isTestimonialSectionDescriptionBold,
            replayUrl,
            replayCode,
            replayVideoSourceType,
            replayVideoFile,
            liveUrl,
            liveCode,
            partnerCode,
            isPartnerCode,
            adminCode,
            isAdminCode,
            isPaymentEnabled,
            paymentLink,
            paymentButtonText,
            paymentSectionTitle,
        };

        // Send to backend
        const userid = `${username}/${templateId}`;
        if (!userid) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "No se encontró el usuario."
            });
            return;
        }
        
        setIsSaving(true);
        fetch('/api/webinar-template', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userid, data: JSON.stringify(data) }),
        })
        .then(async (res) => {
            setIsSaving(false);
            if (res.ok) {
                toast({
                    title: "Guardado!",
                    description: "Los cambios en la plantilla se han guardado."
                });
            } else {
                const error = await res.json();
                toast({
                    variant: "destructive",
                    title: "Error al guardar",
                    description: error?.error || 'No se pudo guardar la plantilla.'
                });
            }
        })
        .catch(() => {
            setIsSaving(false);
            toast({
                variant: "destructive",
                title: "Error de red",
                description: "No se pudo conectar al servidor."
            });
        });
    }

    const handleCopy = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast({ title: 'Copiado al portapapeles' });
    }

    const handleShare = async () => {
        const shareData = {
            title: `Webinar: ${headerHeadline}`,
            text: `¡No te pierdas este webinar! ${headerSubheadline}`,
            url: customLink,
        };
        try {
            if (navigator.share && customLink) {
                await navigator.share(shareData);
                toast({ title: 'Enlace compartido exitosamente' });
            } else {
                throw new Error('Web Share API not supported');
            }
        } catch (error) {
            console.error('Error sharing:', error);
            if ((error as DOMException)?.name !== 'AbortError') {
                handleCopy(customLink);
                toast({
                    title: 'Enlace copiado',
                    description: 'La función de compartir no está disponible, pero hemos copiado el enlace por ti.',
                });
            }
        }
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (!date) return;
        const newDateTime = new Date(webinarDateTime);
        newDateTime.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        setWebinarDateTime(newDateTime);
    };
    
    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const [hours, minutes] = e.target.value.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes)) {
            const newDateTime = new Date(webinarDateTime);
            newDateTime.setHours(hours, minutes);
            setWebinarDateTime(newDateTime);
        }
    };

    const username = currentUserData?.username;
    const customLink = username && templateId ? `https://www.ezperfilwebinars.com/${username}/${templateId}` : '';


    return (
        <div className="flex flex-col md:flex-row h-screen bg-background text-foreground">
            {/* Left Sidebar - Controls */}
            <ScrollArea className="w-full md:w-[380px] h-full md:h-screen bg-card border-r border-border">
                <div className="p-4 space-y-6">
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                           <Link href="/dashboard/my-webinar-room">
                             <ArrowLeft />
                           </Link>
                        </Button>
                        <h1 className="text-xl font-bold">Editar Plantilla ({templateType === 'video' ? 'Video' : 'Texto'})</h1>
                        <Button onClick={handleSave} disabled={isSaving} className="ml-auto">
                            {isSaving ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                    </svg>
                                    Guardando...
                                </span>
                            ) : (
                                'Guardar'
                            )}
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Encabezado Principal</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="header-headline-text" className="text-sm">Título Principal</Label>
                                <Input id="header-headline-text" value={headerHeadline} onChange={(e) => setHeaderHeadline(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="header-headline-size" className="text-sm">Tamaño Título: {headerHeadlineSize}px</Label>
                                <Slider id="header-headline-size" value={[headerHeadlineSize]} onValueChange={(v) => setHeaderHeadlineSize(v[0])} max={72} min={24} step={1} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="header-headline-color" className="text-sm">Color Título</Label>
                                <Input id="header-headline-color" type="color" value={headerHeadlineColor} onChange={(e) => setHeaderHeadlineColor(e.target.value)} className="w-10 h-8 p-1 rounded" />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="header-headline-bold" className="text-sm">Título en Negrita</Label>
                                <Switch id="header-headline-bold" checked={isHeaderHeadlineBold} onCheckedChange={setIsHeaderHeadlineBold} />
                            </div>
                            <Separator />
                            <div>
                                <Label htmlFor="header-subheadline-text" className="text-sm">Subtítulo</Label>
                                <Input id="header-subheadline-text" value={headerSubheadline} onChange={(e) => setHeaderSubheadline(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="header-subheadline-size" className="text-sm">Tamaño Subtítulo: {headerSubheadlineSize}px</Label>
                                <Slider id="header-subheadline-size" value={[headerSubheadlineSize]} onValueChange={(v) => setHeaderSubheadlineSize(v[0])} max={48} min={12} step={1} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="header-subheadline-color" className="text-sm">Color Subtítulo</Label>
                                <Input id="header-subheadline-color" type="color" value={headerSubheadlineColor} onChange={(e) => setHeaderSubheadlineColor(e.target.value)} className="w-10 h-8 p-1 rounded" />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="header-subheadline-bold" className="text-sm">Subtítulo en Negrita</Label>
                                <Switch id="header-subheadline-bold" checked={isHeaderSubheadlineBold} onCheckedChange={setIsHeaderSubheadlineBold} />
                            </div>
                            <Separator />
                            <div className="pt-4 space-y-2">
                                <Label className="text-sm font-medium">Fondo del Encabezado</Label>
                                <RadioGroup value={headerBackgroundType} onValueChange={(v) => setHeaderBackgroundType(v as any)} className="grid grid-cols-3 gap-2 pt-1">
                                    <Label htmlFor="bg-gradient" className={cn("flex flex-col items-center justify-center rounded-md border-2 p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-xs h-10", headerBackgroundType === 'gradient' ? 'border-primary' : 'border-muted')}>
                                        <RadioGroupItem value="gradient" id="bg-gradient" className="sr-only" />
                                        Gradiente
                                    </Label>
                                    <Label htmlFor="bg-color" className={cn("flex flex-col items-center justify-center rounded-md border-2 p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-xs h-10", headerBackgroundType === 'color' ? 'border-primary' : 'border-muted')}>
                                        <RadioGroupItem value="color" id="bg-color" className="sr-only" />
                                        Color
                                    </Label>
                                    <Label htmlFor="bg-image" className={cn("flex flex-col items-center justify-center rounded-md border-2 p-2 hover:bg-accent hover:text-accent-foreground cursor-pointer text-xs h-10", headerBackgroundType === 'image' ? 'border-primary' : 'border-muted')}>
                                        <RadioGroupItem value="image" id="bg-image" className="sr-only" />
                                        Imagen
                                    </Label>
                                </RadioGroup>
                            </div>

                            {headerBackgroundType === 'gradient' && (
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="header-gradient-start" className="text-sm">Inicio Gradiente</Label>
                                        <Input id="header-gradient-start" type="color" value={headerGradientStart} onChange={(e) => setHeaderGradientStart(e.target.value)} className="w-10 h-8 p-1 rounded" />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="header-gradient-end" className="text-sm">Fin Gradiente</Label>
                                        <Input id="header-gradient-end" type="color" value={headerGradientEnd} onChange={(e) => setHeaderGradientEnd(e.target.value)} className="w-10 h-8 p-1 rounded" />
                                    </div>
                                </div>
                            )}

                            {headerBackgroundType === 'color' && (
                                <div className="space-y-4 pt-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="header-solid-color" className="text-sm">Color de Fondo</Label>
                                        <Input id="header-solid-color" type="color" value={headerSolidColor} onChange={(e) => setHeaderSolidColor(e.target.value)} className="w-10 h-8 p-1 rounded" />
                                    </div>
                                </div>
                            )}

                            {headerBackgroundType === 'image' && (
                                <div className="space-y-4 pt-2">
                                    <div>
                                        <Label htmlFor="header-image-upload" className="text-sm">Subir Imagen de Fondo</Label>

                                     <FileUploadDialog

                                     
                                     onChange={(r)=>{
                                            setHeaderImagePreview(r ?? '');
                                     }} />
                                        {/* <Input id="header-image-upload" type="file" accept="image/png, image/jpeg" onChange={setHeaderImagePreview} className="mt-1"/> */}
                                    
                                    
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="header-overlay-color" className="text-sm">Color de Superposición</Label>
                                        <Input id="header-overlay-color" type="color" value={headerOverlayColor} onChange={(e) => setHeaderOverlayColor(e.target.value)} className="w-10 h-8 p-1 rounded" />
                                    </div>
                                    <div>
                                        <Label htmlFor="header-overlay-opacity" className="text-sm">Opacidad Superposición: {Math.round(headerOverlayOpacity * 100)}%</Label>
                                        <Slider id="header-overlay-opacity" value={[headerOverlayOpacity]} onValueChange={(v) => setHeaderOverlayOpacity(v[0])} max={1} min={0} step={0.05} />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Títulos de Sección</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm font-medium">Estilo Global de Títulos</p>
                            <div>
                                <Label htmlFor="title-size" className="text-sm">Tamaño: {titleSize}px</Label>
                                <Slider id="title-size" value={[titleSize]} onValueChange={(v) => setTitleSize(v[0])} max={60} min={16} step={1} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="title-color" className="text-sm">Color</Label>
                                <Input id="title-color" type="color" value={titleColor} onChange={(e) => setTitleColor(e.target.value)} className="w-10 h-8 p-1 rounded" />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="title-bold" className="text-sm">Negrita</Label>
                                <Switch id="title-bold" checked={isTitleBold} onCheckedChange={setIsTitleBold} />
                            </div>

                            <Separator />
                            
                            <p className="text-sm font-medium">Contenido de Títulos</p>
                            
                            {templateType === 'text' && (
                                <div>
                                    <Label htmlFor="learn-title-text" className="text-sm">Título "Qué Aprenderás"</Label>
                                    <Input id="learn-title-text" value={learnSectionTitle} onChange={(e) => setLearnSectionTitle(e.target.value)} />
                                </div>
                            )}
                             <div>
                                <Label htmlFor="presenter-title-text" className="text-sm">Título "Presentador"</Label>
                                
                                
                                <Input id="presenter-title-text" value={presenterSectionTitle} onChange={(e) => setPresenterSectionTitle(e.target.value)} />
                            </div>
                             <div>
                                <Label htmlFor="included-title-text" className="text-sm">Título "Qué Incluye"</Label>
                                <Input id="included-title-text" value={includedSectionTitle} onChange={(e) => setIncludedSectionTitle(e.target.value)} />
                            </div>
                             <div>
                                <Label htmlFor="consideration-title-text" className="text-sm">Título "Consideraciones"</Label>
                                <Input id="consideration-title-text" value={considerationSectionTitle} onChange={(e) => setConsiderationSectionTitle(e.target.value)} />
                            </div>
                             <div>
                                <Label htmlFor="testimonials-title-text" className="text-sm">Título "Testimonios"</Label>
                                <Input id="testimonials-title-text" value={testimonialsSectionTitle} onChange={(e) => setTestimonialsSectionTitle(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="opportunity-title-text" className="text-sm">Título "Oportunidad"</Label>
                                <Input id="opportunity-title-text" value={opportunitySectionTitle} onChange={(e) => setOpportunitySectionTitle(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="opportunity-description-text" className="text-sm">Descripción "Oportunidad"</Label>
                                <Input id="opportunity-description-text" value={opportunitySectionDescription} onChange={(e) => setOpportunitySectionDescription(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <Label htmlFor="opportunity-desc-size" className="text-sm">Tamaño</Label>
                                    <Input 
                                        id="opportunity-desc-size" 
                                        type="number" 
                                        value={opportunitySectionDescriptionSize} 
                                        onChange={(e) => setOpportunitySectionDescriptionSize(parseInt(e.target.value))} 
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="opportunity-desc-color" className="text-sm">Color</Label>
                                    <Input 
                                        id="opportunity-desc-color" 
                                        type="color" 
                                        value={opportunitySectionDescriptionColor} 
                                        onChange={(e) => setOpportunitySectionDescriptionColor(e.target.value)} 
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox 
                                        id="opportunity-desc-bold" 
                                        checked={isOpportunitySectionDescriptionBold} 
                                        onCheckedChange={(checked) => setIsOpportunitySectionDescriptionBold(checked === true)} 
                                    />
                                    <Label htmlFor="opportunity-desc-bold" className="text-sm">Negrita</Label>
                                </div>
                            </div>
                             <div>
                                <Label htmlFor="access-title-text" className="text-sm">Título "Acceso"</Label>
                                <Input id="access-title-text" value={accessSectionTitle} onChange={(e) => setAccessSectionTitle(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="access-description-text" className="text-sm">Descripción "Acceso"</Label>
                                <Input id="access-description-text" value={accessSectionDescription} onChange={(e) => setAccessSectionDescription(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <Label htmlFor="access-desc-size" className="text-sm">Tamaño</Label>
                                    <Input 
                                        id="access-desc-size" 
                                        type="number" 
                                        value={accessSectionDescriptionSize} 
                                        onChange={(e) => setAccessSectionDescriptionSize(parseInt(e.target.value))} 
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="access-desc-color" className="text-sm">Color</Label>
                                    <Input 
                                        id="access-desc-color" 
                                        type="color" 
                                        value={accessSectionDescriptionColor} 
                                        onChange={(e) => setAccessSectionDescriptionColor(e.target.value)} 
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Checkbox 
                                        id="access-desc-bold" 
                                        checked={isAccessSectionDescriptionBold} 
                                        onCheckedChange={(checked) => setIsAccessSectionDescriptionBold(checked === true)} 
                                    />
                                    <Label htmlFor="access-desc-bold" className="text-sm">Negrita</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Fecha y Countdown del Webinar</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="webinar-date">Fecha</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                id="webinar-date"
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal h-9 overflow-hidden ",
                                                    !webinarDateTime && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {webinarDateTime ? format(webinarDateTime, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={webinarDateTime}
                                                onSelect={handleDateSelect}
                                                disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div>
                                    <Label htmlFor="webinar-time">Hora</Label>
                                    <Input
                                        id="webinar-time"
                                        type="time"
                                        value={format(webinarDateTime, 'HH:mm')}
                                        onChange={handleTimeChange}
                                        className="h-9"
                                    />
                                </div>
                            </div>
                            
                            <Separator/>
                            
                            <p className="text-sm font-medium pt-2">Estilo del Texto del Countdown</p>
                            <div>
                                <Label htmlFor="countdown-size" className="text-sm">Tamaño: {countdownSize}px</Label>
                                <Slider id="countdown-size" value={[countdownSize]} onValueChange={(v) => setCountdownSize(v[0])} max={72} min={24} step={1} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="countdown-color" className="text-sm">Color</Label>
                                <Input id="countdown-color" type="color" value={countdownColor} onChange={(e) => setCountdownColor(e.target.value)} className="w-10 h-8 p-1 rounded" />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="countdown-bold" className="text-sm">Negrita</Label>
                                <Switch id="countdown-bold" checked={isCountdownBold} onCheckedChange={setIsCountdownBold} />
                            </div>
                        </CardContent>
                    </Card>

                    {templateType === 'video' ? (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Video del Webinar</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <RadioGroup value={videoSourceType} onValueChange={(value: 'url' | 'upload') => setVideoSourceType(value)}>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="url" id="video-url" />
                                        <Label htmlFor="video-url">Desde URL</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <RadioGroupItem value="upload" id="video-upload" />
                                        <Label htmlFor="video-upload">Subir Video</Label>
                                    </div>
                                </RadioGroup>
                                {videoSourceType === 'url' ? (
                                    <div>
                                        <Label htmlFor="video-url-input">URL del Video</Label>
                                        <Input id="video-url-input" placeholder="https://example.com/video.mp4" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} />
                                    </div>
                                ) : (
                                    <div>
                                        <Label htmlFor="video-file-input">Subir archivo de video</Label>

<FileUploadDialog
                                            onChange={r=>{
                                              
                                                console.log(Rh.ImgUrl + r);
                                                setVideoUrl(Rh.ImgUrl + r);

                                            }}

                                            isImage= {false}
                                        
                                            />


                                        {/* <Input id="video-file-input" type="file" accept="video/mp4,video/webm" onChange={handleVideoFileChange} /> */}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">{learnSectionTitle}</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {learningPoints.map((point, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <Input value={point} onChange={(e) => handleLearningPointChange(index, e.target.value)} className="h-9"/>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveLearningPoint(index)} className="hover:bg-destructive/20">
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                                <Button variant="outline" className="w-full h-9 mt-2" onClick={handleAddLearningPoint}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Añadir punto
                                </Button>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Sección de Caso de Estudio</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="case-study-image-upload" className="text-sm">Imagen del Caso de Estudio</Label>
                                <div className="flex items-center gap-4 mt-2">
                                    <Image src={caseStudyImageUrl} alt="Case study preview" width={80} height={60} className="rounded-md object-cover h-14 w-20" />
                                    {/* <Input 
                                        id="case-study-image-upload" 
                                        type="file" 
                                        accept="image/png, image/jpeg" 
                                        onChange={handleCaseStudyImageChange} 
                                        className="flex-1" 
                                    /> */}

                                    <FileUploadDialog
                                    onChange={r=>{
                                      console.log(Rh.ImgUrl + r);
                                      setCaseStudyImageUrl(Rh.ImgUrl + r);
                                    }}
                                    isImage= {true}
                                    />
                                    
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <Label htmlFor="case-study-headline-text" className="text-sm">Título del Caso de Estudio</Label>
                                <Input id="case-study-headline-text" value={caseStudyHeadline} onChange={(e) => setCaseStudyHeadline(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="case-study-headline-size" className="text-sm">Tamaño Título: {caseStudyHeadlineSize}px</Label>
                                <Slider id="case-study-headline-size" value={[caseStudyHeadlineSize]} onValueChange={(v) => setCaseStudyHeadlineSize(v[0])} max={48} min={16} step={1} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="case-study-headline-color" className="text-sm">Color Título</Label>
                                <Input id="case-study-headline-color" type="color" value={caseStudyHeadlineColor} onChange={(e) => setCaseStudyHeadlineColor(e.target.value)} className="w-10 h-8 p-1 rounded" />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="case-study-headline-bold" className="text-sm">Título en Negrita</Label>
                                <Switch id="case-study-headline-bold" checked={isCaseStudyHeadlineBold} onCheckedChange={setIsCaseStudyHeadlineBold} />
                            </div>
                            <Separator />
                            <div>
                                <Label htmlFor="case-study-description-text" className="text-sm">Descripción del Caso de Estudio</Label>
                                <Textarea id="case-study-description-text" value={caseStudyDescription} onChange={(e) => setCaseStudyDescription(e.target.value)} rows={3}/>
                            </div>
                            <div>
                                <Label htmlFor="case-study-description-size" className="text-sm">Tamaño Descripción: {caseStudyDescriptionSize}px</Label>
                                <Slider id="case-study-description-size" value={[caseStudyDescriptionSize]} onValueChange={(v) => setCaseStudyDescriptionSize(v[0])} max={24} min={12} step={1} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="case-study-description-color" className="text-sm">Color Descripción</Label>
                                <Input id="case-study-description-color" type="color" value={caseStudyDescriptionColor} onChange={(e) => setCaseStudyDescriptionColor(e.target.value)} className="w-10 h-8 p-1 rounded" />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="case-study-description-bold" className="text-sm">Descripción en Negrita</Label>
                                <Switch id="case-study-description-bold" checked={isCaseStudyDescriptionBold} onCheckedChange={setIsCaseStudyDescriptionBold} />
                            </div>
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{includedSectionTitle}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm font-medium">List Items</p>
                            {includedPoints.map((point, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input value={point} onChange={(e) => handleIncludedPointChange(index, e.target.value)} className="h-9"/>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveIncludedPoint(index)} className="hover:bg-destructive/20">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" className="w-full h-9 mt-2" onClick={handleAddIncludedPoint}>
                                <Plus className="mr-2 h-4 w-4" />
                                Añadir punto
                            </Button>
                            <Separator />
                            <p className="text-sm font-medium pt-2">Item Style</p>
                            <div>
                                <Label htmlFor="included-item-size" className="text-sm">Tamaño: {includedItemSize}px</Label>
                                <Slider id="included-item-size" value={[includedItemSize]} onValueChange={(v) => setIncludedItemSize(v[0])} max={24} min={10} step={1} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="included-item-color" className="text-sm">Color</Label>
                                <Input id="included-item-color" type="color" value={includedItemColor} onChange={(e) => setIncludedItemColor(e.target.value)} className="w-10 h-8 p-1 rounded" />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="included-item-bold" className="text-sm">Negrita</Label>
                                <Switch id="included-item-bold" checked={isIncludedItemBold} onCheckedChange={setIsIncludedItemBold} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{presenterSectionTitle}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Presenter Avatar Upload */}
                            <div>
                                <Label htmlFor="presenter-avatar-upload" className="text-sm">Foto del Presentador</Label>
                                <div className="flex items-center gap-4 mt-2">
                                    <Avatar className="h-14 w-14">
                                        <AvatarImage src={presenterAvatar} />
                                        <AvatarFallback>{presenterName.substring(0,2)}</AvatarFallback>
                                    </Avatar>
                                    <FileUploadDialog
                                        onChange={r=>{
                                          console.log(Rh.ImgUrl + r);
                                          setPresenterAvatar(Rh.ImgUrl + r);
                                        }}
                                        isImage= {true}
                                    />


                                    {/* <Input 
                                        id="presenter-avatar-upload" 
                                        type="file" 
                                        accept="image/png, image/jpeg" 
                                        onChange={handleAvatarChange} 
                                        className="flex-1" 
                                    /> */}
                                </div>
                            </div>

                            <Separator />
                            
                            {/* Presenter Name Content */}
                            <div>
                                <Label htmlFor="presenter-name-text" className="text-sm">Nombre del Presentador</Label>
                                <Input id="presenter-name-text" value={presenterName} onChange={(e) => setPresenterName(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="presenter-name-size" className="text-sm">Tamaño Nombre: {presenterNameSize}px</Label>
                                <Slider id="presenter-name-size" value={[presenterNameSize]} onValueChange={(v) => setPresenterNameSize(v[0])} max={36} min={12} step={1} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="presenter-name-color" className="text-sm">Color Nombre</Label>
                                <Input id="presenter-name-color" type="color" value={presenterNameColor} onChange={(e) => setPresenterNameColor(e.target.value)} className="w-10 h-8 p-1 rounded" />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="presenter-name-bold" className="text-sm">Nombre en Negrita</Label>
                                <Switch id="presenter-name-bold" checked={isPresenterNameBold} onCheckedChange={setIsPresenterNameBold} />
                            </div>
                            
                            <Separator />
                            
                            {/* Presenter Description Content */}
                            <div>
                                <Label htmlFor="presenter-description-text" className="text-sm">Descripción del Presentador</Label>
                                <Input id="presenter-description-text" value={presenterDescription} onChange={(e) => setPresenterDescription(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="presenter-description-size" className="text-sm">Tamaño Descripción: {presenterDescriptionSize}px</Label>
                                <Slider id="presenter-description-size" value={[presenterDescriptionSize]} onValueChange={(v) => setPresenterDescriptionSize(v[0])} max={24} min={10} step={1} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="presenter-description-color" className="text-sm">Color Descripción</Label>
                                <Input id="presenter-description-color" type="color" value={presenterDescriptionColor} onChange={(e) => setPresenterDescriptionColor(e.target.value)} className="w-10 h-8 p-1 rounded" />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="presenter-description-bold" className="text-sm">Descripción en Negrita</Label>
                                <Switch id="presenter-description-bold" checked={isPresenterDescriptionBold} onCheckedChange={setIsPresenterDescriptionBold} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{considerationSectionTitle}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm font-medium">Puntos de la Lista</p>
                            {considerationPoints.map((point, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <Input value={point} onChange={(e) => handleConsiderationPointChange(index, e.target.value)} className="h-9"/>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveConsiderationPoint(index)} className="hover:bg-destructive/20">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="outline" className="w-full h-9" onClick={handleAddConsiderationPoint}>
                                <Plus className="mr-2 h-4 w-4" />
                                Añadir punto
                            </Button>
                            <Separator />
                            <p className="text-sm font-medium pt-2">Estilo de los Puntos</p>
                            <div>
                                <Label htmlFor="consideration-item-size" className="text-sm">Tamaño: {considerationItemSize}px</Label>
                                <Slider id="consideration-item-size" value={[considerationItemSize]} onValueChange={(v) => setConsiderationItemSize(v[0])} max={24} min={10} step={1} />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="consideration-item-color" className="text-sm">Color</Label>
                                <Input id="consideration-item-color" type="color" value={considerationItemColor} onChange={(e) => setConsiderationItemColor(e.target.value)} className="w-10 h-8 p-1 rounded" />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="consideration-item-bold" className="text-sm">Negrita</Label>
                                <Switch id="consideration-item-bold" checked={isConsiderationItemBold} onCheckedChange={setIsConsiderationItemBold} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{testimonialsSectionTitle}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div className="space-y-3 p-3 border rounded-md bg-card-foreground/5">
                                <p className="text-sm font-medium">Estilo Global de Testimonios</p>
                                <Separator />
                                <div>
                                    <Label className="text-xs font-semibold">Nombre del Testimoniante</Label>
                                    <div className="mt-2 space-y-4">
                                        <div>
                                            <Label htmlFor="testimonial-name-size" className="text-sm">Tamaño: {testimonialNameSize}px</Label>
                                            <Slider id="testimonial-name-size" value={[testimonialNameSize]} onValueChange={(v) => setTestimonialNameSize(v[0])} max={24} min={12} step={1} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="testimonial-name-color" className="text-sm">Color</Label>
                                            <Input id="testimonial-name-color" type="color" value={testimonialNameColor} onChange={(e) => setTestimonialNameColor(e.target.value)} className="w-10 h-8 p-1 rounded" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="testimonial-name-bold" className="text-sm">Negrita</Label>
                                            <Switch id="testimonial-name-bold" checked={isTestimonialNameBold} onCheckedChange={setIsTestimonialNameBold} />
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <Label className="text-xs font-semibold">Texto de Descripción</Label>
                                    <div className="mt-2 space-y-4">
                                        <div>
                                            <Label htmlFor="testimonial-desc-size" className="text-sm">Tamaño: {testimonialDescriptionSize}px</Label>
                                            <Slider id="testimonial-desc-size" value={[testimonialDescriptionSize]} onValueChange={(v) => setTestimonialDescriptionSize(v[0])} max={18} min={10} step={1} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="testimonial-desc-color" className="text-sm">Color</Label>
                                            <Input id="testimonial-desc-color" type="color" value={testimonialDescriptionColor} onChange={(e) => setTestimonialDescriptionColor(e.target.value)} className="w-10 h-8 p-1 rounded" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="testimonial-desc-bold" className="text-sm">Negrita</Label>
                                            <Switch id="testimonial-desc-bold" checked={isTestimonialDescriptionBold} onCheckedChange={setIsTestimonialDescriptionBold} />
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <Label className="text-xs font-semibold">Etiquetas "Antes" y "Después"</Label>
                                    <div className="mt-2 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="testimonial-before-color" className="text-sm">Color "Antes"</Label>
                                            <Input id="testimonial-before-color" type="color" value={testimonialBeforeLabelColor} onChange={(e) => setTestimonialBeforeLabelColor(e.target.value)} className="w-10 h-8 p-1 rounded" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="testimonial-after-color" className="text-sm">Color "Después"</Label>
                                            <Input id="testimonial-after-color" type="color" value={testimonialAfterLabelColor} onChange={(e) => setTestimonialAfterLabelColor(e.target.value)} className="w-10 h-8 p-1 rounded" />
                                        </div>
                                    </div>
                                </div>
                                <Separator />
                                <div>
                                    <Label className="text-xs font-semibold">Descripción de la Sección</Label>
                                    <div className="mt-2 space-y-4">
                                        <div>
                                            <Label htmlFor="testimonial-section-desc-text" className="text-sm">Texto</Label>
                                            <Input id="testimonial-section-desc-text" value={testimonialSectionDescription} onChange={(e) => setTestimonialSectionDescription(e.target.value)} className="h-9" />
                                        </div>
                                        <div>
                                            <Label htmlFor="testimonial-section-desc-size" className="text-sm">Tamaño: {testimonialSectionDescriptionSize}px</Label>
                                            <Slider id="testimonial-section-desc-size" value={[testimonialSectionDescriptionSize]} onValueChange={(v) => setTestimonialSectionDescriptionSize(v[0])} max={24} min={10} step={1} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="testimonial-section-desc-color" className="text-sm">Color</Label>
                                            <Input id="testimonial-section-desc-color" type="color" value={testimonialSectionDescriptionColor} onChange={(e) => setTestimonialSectionDescriptionColor(e.target.value)} className="w-10 h-8 p-1 rounded" />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="testimonial-section-desc-bold" className="text-sm">Negrita</Label>
                                            <Switch id="testimonial-section-desc-bold" checked={isTestimonialSectionDescriptionBold} onCheckedChange={setIsTestimonialSectionDescriptionBold} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {testimonials.map((testimonial, index) => (
                                <div key={testimonial.id} className="space-y-3 p-3 border rounded-md">
                                    <p className="text-sm font-medium">Testimonio {index + 1}</p>
                                    
                                    {/* Person Avatar */}
                                    <div>
                                        <Label htmlFor={`testimonial-person-avatar-${index}`} className="text-xs">Foto del Testimoniante</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={testimonial.personAvatarUrl} />
                                                <AvatarFallback>{testimonial.name.substring(0,2)}</AvatarFallback>
                                            </Avatar>
<FileUploadDialog 
                                                onChange={r=>{
                                                  console.log(Rh.ImgUrl + r);
                                                  handleTestimonialImageChange(r ?? '', index, 'person');
                                                }}
                                                isImage= {true}
                                            />  
                                     
                                
                                            {/* <Input id={`testimonial-person-avatar-${index}`} type="file" accept="image/png, image/jpeg" onChange={(e) => handleTestimonialImageChange(e, index, 'person')} className="flex-1 text-xs h-9" /> */}
                                        </div>
                                    </div>
                                    
                                    {/* Name */}
                                    <div>
                                        <Label htmlFor={`testimonial-name-${index}`} className="text-xs">Nombre</Label>
                                        <Input id={`testimonial-name-${index}`} value={testimonial.name} onChange={(e) => handleTestimonialChange(index, 'name', e.target.value)} className="h-9" />
                                    </div>

                                    {/* Before Section */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Antes</Label>
                                        <div>
                                            <Label htmlFor={`testimonial-before-image-${index}`} className="text-xs">Foto (Antes)</Label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Image src={testimonial.beforeImageUrl} alt="Before preview" width={40} height={40} className="rounded-md object-cover h-10 w-10" />
                                                <FileUploadDialog
                                                    onChange={r=>{
                                                      console.log(Rh.ImgUrl + r);
                                                      handleTestimonialImageChange(r ?? '', index, 'before');
                                                    }}
                                                    isImage= {true}
                                                />
                                                {/* <Input id={`testimonial-before-image-${index}`} type="file" accept="image/png, image/jpeg" onChange={(e) => handleTestimonialImageChange(e, index, 'before')} className="flex-1 text-xs h-9" /> */}
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor={`testimonial-problem-${index}`} className="text-xs">Descripción (Antes)</Label>
                                            <Textarea id={`testimonial-problem-${index}`} value={testimonial.problem} onChange={(e) => handleTestimonialChange(index, 'problem', e.target.value)} rows={2} className="text-sm" />
                                        </div>
                                    </div>

                                    {/* After Section */}
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold">Después</Label>
                                        <div>
                                            <Label htmlFor={`testimonial-after-image-${index}`} className="text-xs">Foto (Después)</Label>
                                            <div className="flex items-center gap-2 mt-1">
                                                 <Image src={testimonial.afterImageUrl} alt="After preview" width={40} height={40} className="rounded-md object-cover h-10 w-10" />
                                                <FileUploadDialog
                                                    onChange={r=>{
                                                      console.log(Rh.ImgUrl + r);
                                                      handleTestimonialImageChange(r ?? '', index, 'after');
                                                    }}
                                                    isImage= {true}
                                                />
                                                {/* <Input id={`testimonial-after-image-${index}`} type="file" accept="image/png, image/jpeg" onChange={(e) => handleTestimonialImageChange(e, index, 'after')} className="flex-1 text-xs h-9" /> */}
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor={`testimonial-solution-${index}`} className="text-xs">Descripción (Después)</Label>
                                            <Textarea id={`testimonial-solution-${index}`} value={testimonial.solution} onChange={(e) => handleTestimonialChange(index, 'solution', e.target.value)} rows={2} className="text-sm" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base">{accessSectionTitle}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="font-medium text-sm">Contenido de la Repetición</p>
                             <RadioGroup value={replayVideoSourceType} onValueChange={(value) => setReplayVideoSourceType(value as 'url' | 'upload')}>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="url" id="replay-url-option" />
                                    <Label htmlFor="replay-url-option">Desde URL</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="upload" id="replay-upload-option" />
                                    <Label htmlFor="replay-upload-option">Subir Video</Label>
                                </div>
                            </RadioGroup>

                            {replayVideoSourceType === 'url' ? (
                                <>
                                    <div>
                                        <Label htmlFor="replay-url">URL del Replay</Label>
                                        <Input id="replay-url" placeholder="https://..." value={replayUrl} onChange={(e) => setReplayUrl(e.target.value)} />
                                    </div>
                                    <div>
                                        <Label htmlFor="replay-code">Código para Replay</Label>
                                        <Input id="replay-code" placeholder="REPLAY123" value={replayCode} onChange={(e) => setReplayCode(e.target.value)} />
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <Label htmlFor="replay-video-file">Subir video de repetición</Label>
                                    
<FileUploadDialog
                                        onChange={r=>{
                                          console.log(Rh.ImgUrl + r);
                                          setReplayVideoFile(Rh.ImgUrl + r);
                                        }}
                                        isImage= {false}
                                    />  

                                    {/* <Input id="replay-video-file" type="file" accept="video/mp4,video/webm" onChange={handleReplayVideoFileChange} /> */}
                                   
                                   
                                    {/* {replayVideoFile && <video src={replayVideoFile} controls className="mt-2 w-full max-w-xs" />} */}
                                </div>
                            )}

                            <Separator />
                            <p className="font-medium text-sm">Contenido en Vivo</p>
                            <div>
                                <Label htmlFor="live-url">URL del Webinar en Vivo</Label>
                                <Input id="live-url" placeholder="https://..." value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} />
                            </div>
                            <div>
                                <Label htmlFor="live-code">Código para Webinar en Vivo</Label>
                                <Input id="live-code" placeholder="LIVE123" value={liveCode} onChange={(e) => setLiveCode(e.target.value)} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Sincronización de Contenido (Clonación)</CardTitle>
                            <CardDescription>
                                Usa el contenido de otra plantilla manteniendo tu información personal. Activa una opción para empezar a sincronizar.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="partner-code-switch">Sincronizar con Partner</Label>
                                    <Switch
                                        id="partner-code-switch"
                                        checked={isPartnerCode}
                                        onCheckedChange={(checked) => {
                                            setIsPartnerCode(checked);
                                            if (checked) {
                                                setIsAdminCode(false);
                                                toast({ title: 'Sincronización con Partner activada.' });
                                            }
                                        }}
                                    />
                                </div>
                                <Input
                                    id="partner-code"
                                    placeholder="Introduce el código del Partner"
                                    value={partnerCode}
                                    onChange={(e) => setPartnerCode(e.target.value)}
                                    disabled={!isPartnerCode}
                                />
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="admin-code-switch">Sincronizar con Admin</Label>
                                    <Switch
                                        id="admin-code-switch"
                                        checked={isAdminCode}
                                        onCheckedChange={(checked) => {
                                            setIsAdminCode(checked);
                                            if (checked) {
                                                setIsPartnerCode(false);
                                                toast({ title: 'Sincronización con Admin activada.' });
                                            }
                                        }}
                                    />
                                </div>
                                <Input
                                    id="admin-code"
                                    placeholder="Introduce el código del Admin"
                                    value={adminCode}
                                    onChange={(e) => setAdminCode(e.target.value)}
                                    disabled={!isAdminCode}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Información del Enlace Personalizado</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-1">
                                <Label className="text-xs">Template ID</Label>
                                <div className="flex items-center gap-2">
                                    <Input readOnly value={templateId || ''} className="h-9 text-xs"/>
                                    <Button variant="ghost" size="icon" onClick={() => handleCopy(templateId || '')}><Copy className="h-4 w-4"/></Button>
                                </div>
                            </div>
                             <div className="space-y-1">
                                <Label className="text-xs">Usuario</Label>
                                 <div className="flex items-center gap-2">
                                    {loadingUserData ? (
                                        <Skeleton className="h-9 w-full" />
                                    ) : (
                                        <Input readOnly value={username || 'No definido'} className="h-9"/>
                                    )}
                                    <Button variant="ghost" size="icon" disabled>
                                        <Pencil className="h-4 w-4"/>
                                    </Button>
                                 </div>
                            </div>
                             <div className="space-y-1">
                                <Label className="text-xs">Enlace Personalizado para Compartir</Label>
                                 <div className="flex items-center gap-2">
                                     {loadingUserData ? (
                                        <Skeleton className="h-9 w-full" />
                                     ) : (
                                        <Input readOnly value={customLink} className="h-9"/>
                                     )}
                                    <Button variant="ghost" size="icon" onClick={() => handleCopy(customLink)} disabled={!customLink}>
                                        <Copy className="h-4 w-4"/>
                                    </Button>
                                    {canShare && (
                                        <Button variant="ghost" size="icon" onClick={handleShare} disabled={!customLink}>
                                            <Share2 className="h-4 w-4"/>
                                        </Button>
                                    )}
                                 </div>
                            </div>
                            <Button asChild variant="outline" className="w-full h-9" disabled={!customLink}>
                                <Link href={customLink || '#'} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Abrir Webinar de {username || '...'}
                                </Link>
                            </Button>
                            {customLink ? (
                                <div className="flex items-start gap-2 text-sm text-green-500 p-2 bg-green-500/10 rounded-md">
                                    <Check className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span className="text-xs">Enlace generado listo para compartir.</span>
                                </div>
                            ) : (
                                <div className="flex items-start gap-2 text-sm text-yellow-500 p-2 bg-yellow-500/10 rounded-md">
                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span className="text-xs">Define tu nombre de usuario en tu perfil para generar el enlace.</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Sección de Pago</CardTitle>
                            <CardDescription>
                                Activa esta sección para cobrar por el acceso al webinar.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                    <Label htmlFor="payment-enabled-switch">Activar Sección de Pago</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Muestra un botón de pago en tu página.
                                    </p>
                                </div>
                                <Switch
                                    id="payment-enabled-switch"
                                    checked={isPaymentEnabled}
                                    onCheckedChange={setIsPaymentEnabled}
                                />
                            </div>

                            {isPaymentEnabled && (
                                <div className="space-y-4 pt-2">
                                    <div>
                                        <Label htmlFor="payment-title-text">Título de la Sección</Label>
                                        <Input 
                                            id="payment-title-text" 
                                            value={paymentSectionTitle} 
                                            onChange={(e) => setPaymentSectionTitle(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="payment-link-input">Enlace de Pago (Stripe, PayPal, etc.)</Label>
                                        <Input 
                                            id="payment-link-input" 
                                            placeholder="https://..." 
                                            value={paymentLink} 
                                            onChange={(e) => setPaymentLink(e.target.value)} 
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="payment-button-text">Texto del Botón</Label>
                                        <Input 
                                            id="payment-button-text" 
                                            placeholder="Pagar ticket" 
                                            value={paymentButtonText} 
                                            onChange={(e) => setPaymentButtonText(e.target.value)}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                     <Card>

                        <CardHeader>
                            <CardTitle className="text-base">Guardar Cambios </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                                        </svg>
                                        Guardando...
                                    </span>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4"/>
                                        Guardar y Cerrar
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Estado del Template</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                             <div>
                                <Label>Template Activo</Label>
                                <p className="text-xs text-muted-foreground">El template está visible y disponible.</p>
                            </div>
                            <Switch defaultChecked={true} />
                        </CardContent>
                    </Card>
                </div>
            </ScrollArea>

            {/* Right Panel - Live Preview */}
            <ScrollArea className="flex-1">
                <div className="p-4 sm:p-8">
                    <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold">Vista Previa en Vivo</p>
                        <Settings className="h-4 w-4 text-muted-foreground"/>
                    </div>
                    
                    <WebinarLandingPage
                        templateType={templateType}
                        headerHeadline={headerHeadline}
                        headerSubheadline={headerSubheadline}
                        headerHeadlineSize={headerHeadlineSize}
                        headerHeadlineColor={headerHeadlineColor}
                        isHeaderHeadlineBold={isHeaderHeadlineBold}
                        headerSubheadlineSize={headerSubheadlineSize}
                        headerSubheadlineColor={headerSubheadlineColor}
                        isHeaderSubheadlineBold={isHeaderSubheadlineBold}
                        headerBackgroundType={headerBackgroundType}
                        headerGradientStart={headerGradientStart}
                        headerGradientEnd={headerGradientEnd}
                        headerSolidColor={headerSolidColor}
                        headerImagePreview={headerImagePreview}
                        headerOverlayColor={headerOverlayColor}
                        headerOverlayOpacity={headerOverlayOpacity}
                        titleSize={titleSize}
                        titleColor={titleColor}
                        isTitleBold={isTitleBold}
                        learnSectionTitle={learnSectionTitle}
                        presenterSectionTitle={presenterSectionTitle}
                        includedSectionTitle={includedSectionTitle}
                        considerationSectionTitle={considerationSectionTitle}
                        testimonialsSectionTitle={testimonialsSectionTitle}
                        opportunitySectionTitle={opportunitySectionTitle}
                        accessSectionTitle={accessSectionTitle}
                        opportunitySectionDescription={opportunitySectionDescription}
                        opportunitySectionDescriptionSize={opportunitySectionDescriptionSize}
                        opportunitySectionDescriptionColor={opportunitySectionDescriptionColor}
                        isOpportunitySectionDescriptionBold={isOpportunitySectionDescriptionBold}
                        accessSectionDescription={accessSectionDescription}
                        accessSectionDescriptionSize={accessSectionDescriptionSize}
                        accessSectionDescriptionColor={accessSectionDescriptionColor}
                        isAccessSectionDescriptionBold={isAccessSectionDescriptionBold}
                        webinarDateTime={webinarDateTime}
                        countdownSize={countdownSize}
                        countdownColor={countdownColor}
                        isCountdownBold={isCountdownBold}
                        previewVideoUrl={previewVideoUrl}
                        learningPoints={learningPoints}
                        caseStudyHeadline={caseStudyHeadline}
                        caseStudyDescription={caseStudyDescription}
                        caseStudyImageUrl={caseStudyImageUrl}
                        caseStudyImageFile={caseStudyImageFile}
                        caseStudyHeadlineSize={caseStudyHeadlineSize}
                        caseStudyHeadlineColor={caseStudyHeadlineColor}
                        isCaseStudyHeadlineBold={isCaseStudyHeadlineBold}
                        caseStudyDescriptionSize={caseStudyDescriptionSize}
                        caseStudyDescriptionColor={caseStudyDescriptionColor}
                        isCaseStudyDescriptionBold={isCaseStudyDescriptionBold}
                        includedPoints={includedPoints}
                        includedItemSize={includedItemSize}
                        includedItemColor={includedItemColor}
                        isIncludedItemBold={isIncludedItemBold}
                        presenterName={presenterName}
                        presenterDescription={presenterDescription}
                        presenterNameSize={presenterNameSize}
                        presenterNameColor={presenterNameColor}
                        isPresenterNameBold={isPresenterNameBold}
                        presenterDescriptionSize={presenterDescriptionSize}
                        presenterDescriptionColor={presenterDescriptionColor}
                        isPresenterDescriptionBold={isPresenterDescriptionBold}
                        presenterAvatar={presenterAvatar}
                        presenterAvatarFile={presenterAvatarFile}
                        considerationPoints={considerationPoints}
                        considerationItemSize={considerationItemSize}
                        considerationItemColor={considerationItemColor}
                        isConsiderationItemBold={isConsiderationItemBold}
                        testimonials={testimonials}
                        testimonialNameSize={testimonialNameSize}
                        testimonialNameColor={testimonialNameColor}
                        isTestimonialNameBold={isTestimonialNameBold}
                        testimonialDescriptionSize={testimonialDescriptionSize}
                        testimonialDescriptionColor={testimonialDescriptionColor}
                        isTestimonialDescriptionBold={isTestimonialDescriptionBold}
                        testimonialBeforeLabelColor={testimonialBeforeLabelColor}
                        testimonialAfterLabelColor={testimonialAfterLabelColor}
                        testimonialSectionDescription={testimonialSectionDescription}
                        testimonialSectionDescriptionSize={testimonialSectionDescriptionSize}
                        testimonialSectionDescriptionColor={testimonialSectionDescriptionColor}
                        isTestimonialSectionDescriptionBold={isTestimonialSectionDescriptionBold}
                        isPaymentEnabled={isPaymentEnabled}
                        paymentLink={paymentLink}
                        inviterUsername={username ?? ''}
                        paymentButtonText={paymentButtonText}
                        paymentSectionTitle={paymentSectionTitle} replayCode={''} replayUrl={''} liveCode={''} liveUrl={''}                    />
                </div>
            </ScrollArea>
        </div>
    );
}

export default function WebinarEditorPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <WebinarEditor />
        </Suspense>
    )
}

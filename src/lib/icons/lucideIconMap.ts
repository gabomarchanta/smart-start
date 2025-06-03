// Importa solo los iconos que quieras ofrecer en el picker para no inflar el bundle
// O importa todos si lo prefieres, pero ten en cuenta el tamaño.
import {
	AlertTriangle, Archive, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, AtSign, Award,
	BarChart2, Bell, Book, Bookmark, Briefcase, Calendar, Camera, CheckCircle, ChevronDown,
	ChevronLeft, ChevronRight, ChevronUp, ChevronsDown, ChevronsLeft, ChevronsRight,
	ChevronsUp, Circle, Clipboard, Clock, Cloud, Code, Codepen, Command, Compass, Copy,
	Cpu, CreditCard, Crop, Crosshair, Database, Delete, Disc, DollarSign, Download, Edit,
	ExternalLink, Eye, EyeOff, Facebook, Feather, Figma, File, FileText, Film, Filter, Flag,
	Folder, FolderPlus, FolderMinus, Gift, GitBranch, GitCommit, GitMerge, GitPullRequest,
	Github, Gitlab, Globe, Grid, Hammer, HardDrive, Hash, Headphones, Heart, HelpCircle, Home, Image,
	Inbox, Info, Instagram, Italic, Key, Layers, Layout, LifeBuoy, Link, Link2, Linkedin, List,
	Loader, Lock, LogIn, LogOut, Mail, Map, MapPin, Maximize, Maximize2, Menu, MessageCircle,
	Mic, Minimize, Minimize2, Monitor, Moon, MoreHorizontal, MoreVertical, MousePointer, Move,
	Music, Navigation, Navigation2, Octagon, Package, Paperclip, Pause, PauseCircle, PenTool,
	Percent, Phone, PieChart, Play, PlayCircle, Plus, PlusCircle, PlusSquare, Pocket, Power,
	Printer, Radio, RefreshCcw, RefreshCw, Repeat, Rewind, Rss, Save, Scissors, Search, Send,
	Server, Settings, Share, Share2, Shield, ShoppingBag, ShoppingCart, Shuffle, Sidebar,
	SkipBack, SkipForward, Slack, Sliders, Smartphone, Smile, Speaker, Square, Star, StopCircle,
	Sun, Sunrise, Sunset, Tablet, Tag, Target, Terminal, ThumbsDown, ThumbsUp, ToggleLeft,
	ToggleRight, Trash, Trash2, Trello, TrendingDown, TrendingUp, Triangle, Truck, Tv,
	Twitch, Twitter, Type, Underline, Unlock, Upload, User, UserCheck, UserMinus, UserPlus,
	UserX, Users, Video, Voicemail, Volume, Volume1, Volume2, VolumeX, Watch, Wifi, WifiOff,
	Wind, X, XCircle, XOctagon, XSquare, Youtube, Zap, ZapOff, ZoomIn, ZoomOut,
    Palette, Gamepad2 // Añadidos de nuestro defaultData
	// ... ¡Añade más según necesites!
} from 'lucide-svelte';

// Este objeto mapeará el nombre del string (que guardaremos en el store) al componente Svelte
export const lucideIcons = {
	AlertTriangle, Archive, ArrowDown, ArrowLeft, ArrowRight, ArrowUp, AtSign, Award,
	BarChart2, Bell, Book, Bookmark, Briefcase, Calendar, Camera, CheckCircle, ChevronDown,
	ChevronLeft, ChevronRight, ChevronUp, ChevronsDown, ChevronsLeft, ChevronsRight,
	ChevronsUp, Circle, Clipboard, Clock, Cloud, Code, Codepen, Command, Compass, Copy,
	Cpu, CreditCard, Crop, Crosshair, Database, Delete, Disc, DollarSign, Download, Edit,
	ExternalLink, Eye, EyeOff, Facebook, Feather, Figma, File, FileText, Film, Filter, Flag,
	Folder, FolderPlus, FolderMinus, Gift, GitBranch, GitCommit, GitMerge, GitPullRequest,
	Github, Gitlab, Globe, Grid, Hammer, HardDrive, Hash, Headphones, Heart, HelpCircle, Home, Image,
	Inbox, Info, Instagram, Italic, Key, Layers, Layout, LifeBuoy, Link, Link2, Linkedin, List,
	Loader, Lock, LogIn, LogOut, Mail, Map, MapPin, Maximize, Maximize2, Menu, MessageCircle,
	Mic, Minimize, Minimize2, Monitor, Moon, MoreHorizontal, MoreVertical, MousePointer, Move,
	Music, Navigation, Navigation2, Octagon, Package, Paperclip, Pause, PauseCircle, PenTool,
	Percent, Phone, PieChart, Play, PlayCircle, Plus, PlusCircle, PlusSquare, Pocket, Power,
	Printer, Radio, RefreshCcw, RefreshCw, Repeat, Rewind, Rss, Save, Scissors, Search, Send,
	Server, Settings, Share, Share2, Shield, ShoppingBag, ShoppingCart, Shuffle, Sidebar,
	SkipBack, SkipForward, Slack, Sliders, Smartphone, Smile, Speaker, Square, Star, StopCircle,
	Sun, Sunrise, Sunset, Tablet, Tag, Target, Terminal, ThumbsDown, ThumbsUp, ToggleLeft,
	ToggleRight, Trash, Trash2, Trello, TrendingDown, TrendingUp, Triangle, Truck, Tv,
	Twitch, Twitter, Type, Underline, Unlock, Upload, User, UserCheck, UserMinus, UserPlus,
	UserX, Users, Video, Voicemail, Volume, Volume1, Volume2, VolumeX, Watch, Wifi, WifiOff,
	Wind, X, XCircle, XOctagon, XSquare, Youtube, Zap, ZapOff, ZoomIn, ZoomOut,
    Palette, Gamepad2
};

// Exportamos también un array de los nombres para iterar en el picker
export const lucideIconNames = Object.keys(lucideIcons) as Array<keyof typeof lucideIcons>;

// Tipo para los nombres de los iconos, para mayor seguridad
export type LucideIconName = keyof typeof lucideIcons;
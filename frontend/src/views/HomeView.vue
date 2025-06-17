<template>
    <div class="max-w-7xl mx-auto">
        <!-- Hero section -->
        <div class="text-center py-12">
            <div class="glass-container rounded-2xl p-8 mb-8 glass-hover">
                <h1 class="text-4xl font-bold tracking-tight glass-text sm:text-5xl md:text-6xl">
                    <span class="block">Model United Nations</span>
                    <span class="block text-un-blue">Platform</span>
                </h1>
                <p class="mt-3 text-base glass-text-light sm:mx-auto sm:mt-5 sm:max-w-xl sm:text-lg md:mt-5 md:text-xl">
                    A comprehensive platform for organizing and conducting Model UN events, bringing together
                    administrators, presidium members, and delegates.
                </p>
                <div class="mt-8 flex justify-center gap-x-4">
                    <router-link to="/login" class="btn btn-primary glass-button">
                        Admin/Presidium Login
                    </router-link>
                    <router-link to="/delegate/auth" class="btn btn-outline glass-button">
                        Delegate Access
                    </router-link>
                </div>
            </div>
        </div>

        <!-- Features grid -->
        <div class="mt-12">
            <div class="text-center mb-12">
                <h2 class="text-3xl font-bold glass-text mb-4">Platform Features</h2>
                <p class="text-lg glass-text-light max-w-2xl mx-auto">
                    Discover the powerful tools designed for each role in your Model UN event
                </p>
            </div>

            <div class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                <!-- Admin features -->
                <div class="glass-feature-card">
                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-un-blue text-white mb-4 shadow-lg">
                        <UserGroupIcon class="h-6 w-6" />
                    </div>
                    <h3 class="text-lg font-medium glass-text">Administrators</h3>
                    <p class="mt-2 text-sm glass-text-light mb-4">
                        Complete event management and oversight capabilities
                    </p>
                    <ul class="mt-4 space-y-2 glass-text-light">
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                            <span class="text-sm">Create and manage events</span>
                        </li>
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                            <span class="text-sm">Set up committees</span>
                        </li>
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                            <span class="text-sm">Generate delegate QR codes</span>
                        </li>
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                            <span class="text-sm">Monitor committee activities</span>
                        </li>
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                            <span class="text-sm">Export comprehensive reports</span>
                        </li>
                    </ul>
                </div>

                <!-- Presidium features -->
                <div class="glass-feature-card">
                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-un-blue text-white mb-4 shadow-lg">
                        <ClipboardDocumentListIcon class="h-6 w-6" />
                    </div>
                    <h3 class="text-lg font-medium glass-text">Presidium</h3>
                    <p class="mt-2 text-sm glass-text-light mb-4">
                        Professional committee management and moderation tools
                    </p>
                    <ul class="mt-4 space-y-2 glass-text-light">
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                            <span class="text-sm">Manage committee sessions</span>
                        </li>
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                            <span class="text-sm">Review resolutions</span>
                        </li>
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                            <span class="text-sm">Conduct voting procedures</span>
                        </li>
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                            <span class="text-sm">Manage speaker lists</span>
                        </li>
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                            <span class="text-sm">Control session timers</span>
                        </li>
                    </ul>
                </div>

                <!-- Delegate features -->
                <div class="glass-feature-card">
                    <div class="flex items-center justify-center h-12 w-12 rounded-md bg-un-blue text-white mb-4 shadow-lg">
                        <DocumentTextIcon class="h-6 w-6" />
                    </div>
                    <h3 class="text-lg font-medium glass-text">Delegates</h3>
                    <p class="mt-2 text-sm glass-text-light mb-4">
                        Streamlined participation and collaboration features
                    </p>
                    <ul class="mt-4 space-y-2 glass-text-light">
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                            <span class="text-sm">Submit resolutions</span>
                        </li>
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                            <span class="text-sm">Propose amendments</span>
                        </li>
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                            <span class="text-sm">Participate in voting</span>
                        </li>
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                            <span class="text-sm">Collaborate on documents</span>
                        </li>
                        <li class="flex items-center">
                            <CheckIcon class="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                            <span class="text-sm">Track personal statistics</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Additional Features Section -->
        <div class="mt-16">
            <div class="glass-container rounded-2xl p-8">
                <div class="text-center mb-8">
                    <h2 class="text-2xl font-bold glass-text mb-4">Why Choose MUN.UZ?</h2>
                    <p class="text-lg glass-text-light max-w-3xl mx-auto">
                        Experience the future of Model UN with our comprehensive digital platform
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="text-center glass-card">
                        <div class="glass-primary rounded-full p-3 inline-flex mb-4">
                            <svg class="h-6 w-6 text-un-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                            </svg>
                        </div>
                        <h4 class="font-semibold glass-text mb-2">Real-time Updates</h4>
                        <p class="text-sm glass-text-light">Live synchronization across all devices and participants</p>
                    </div>

                    <div class="text-center glass-card">
                        <div class="glass-success rounded-full p-3 inline-flex mb-4">
                            <svg class="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                        <h4 class="font-semibold glass-text mb-2">Secure & Reliable</h4>
                        <p class="text-sm glass-text-light">Enterprise-grade security with 99.9% uptime guarantee</p>
                    </div>

                    <div class="text-center glass-card">
                        <div class="glass-warning rounded-full p-3 inline-flex mb-4">
                            <svg class="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                        <h4 class="font-semibold glass-text mb-2">Mobile Friendly</h4>
                        <p class="text-sm glass-text-light">Optimized for all devices with responsive design</p>
                    </div>

                    <div class="text-center glass-card">
                        <div class="glass-primary rounded-full p-3 inline-flex mb-4">
                            <svg class="h-6 w-6 text-un-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z"></path>
                            </svg>
                        </div>
                        <h4 class="font-semibold glass-text mb-2">Analytics & Reports</h4>
                        <p class="text-sm glass-text-light">Comprehensive insights and detailed performance metrics</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Call to Action -->
        <div class="mt-16 text-center">
            <div class="glass-container rounded-2xl p-8 glass-hover">
                <h2 class="text-2xl font-bold glass-text mb-4">Ready to Get Started?</h2>
                <p class="text-lg glass-text-light mb-6 max-w-2xl mx-auto">
                    Join thousands of educators and students who trust MUN.UZ for their Model UN events
                </p>
                <div class="flex justify-center gap-x-4">
                    <router-link to="/login" class="btn btn-primary glass-button">
                        Start Your Event
                    </router-link>
                    <router-link to="/delegate/auth" class="btn btn-outline glass-button">
                        Join as Delegate
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { UserGroupIcon, ClipboardDocumentListIcon, DocumentTextIcon, CheckIcon } from '@heroicons/vue/24/outline'
</script>